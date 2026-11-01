// UI requests to the Millida API (api.millida.net/v2) and the site addresses. In the app a request goes through the core, which adds
// the token itself. The direct fetch below has no token, it is a fallback for the browser in development. The Modrinth catalog goes through our API (/launcher/mr).
import { hasTauri } from '../ipc/tauri'
import { millidaApi, openUrl, type ApiMarket } from '../ipc/commands'
import { getLocale, getMarket } from '../i18n'
import { hasMillidaSession } from './secure'
import { shortfallMarker } from './money'
import { DEMO_USER, ECONOMY_SHOWCASE, demoAnswer } from './demo'

// Dev-приложение открыто с http://localhost:5173, а прод по CORS пускает только
// tauri://localhost — прямые запросы (каталог Modrinth, скины в WebGL) падали.
// В dev с localhost ходим через прокси Vite (/papi → api.millida.net).
export const LAUNCHER_API = 'https://services.cubed.invalid/v2'
export const MODRINTH_API = 'https://api.modrinth.com'
export function mirrorAsset(url: string | undefined | null): string | undefined { return url || undefined }

export const PROFILE_URL = 'https://millida.net/profile'

export const PLUS_MANAGE_URL = 'https://millida.net/profile#plus'

export const SUPPORT_URL = 'https://millida.net/chats?tab=support'

// No Authorization here: authenticated calls go through the core, which holds
// the token. The plain fetch path is the unauthenticated browser fallback.
export function apiHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json', ...langHeaders() }
}

export function langHeaders(): Record<string, string> {
  const lang = getLocale()
  return { 'Accept-Language': lang, 'X-Lang': lang }
}

/// The API keeps a separate server rating per market and picks it by header, the
/// same way cobblo.net asks for the English one. Only the rating is split.
export function marketFor(pathname: string): ApiMarket | undefined {
  if (!pathname.startsWith('/rating/') && !pathname.startsWith('/launcher/premium')) return undefined
  return getMarket() === 'RU' ? undefined : 'EN'
}

export function hasMillidaAccount(): boolean {
  return hasMillidaSession()
}

/// Signalled by event rather than calling session.ts directly, which would be a circular import.
export const SESSION_EXPIRED_EVENT = 'millida-session-expired'

export async function api<T = any>(pathname: string, opts?: RequestInit): Promise<T> {
  if (!millidaServicesEnabled()) throw new Error('Сервисы Millida удалены из Cubed Launcher')
  // Витрина экономики в dev-приложении (VITE_ECONOMY_SHOWCASE): на проде новых
  // адресов магазина ещё нет, поэтому подменяем их и в Tauri, а не только в
  // браузере — иначе магазин в приложении пустой. Только dev-сборка.
  if (import.meta.env.DEV && ECONOMY_SHOWCASE && !DEMO_USER) {
    const demo = demoAnswer(pathname, opts)
    if (demo) return (await import('./demoText')).localizeDemoAnswer((await demo) as T)
  }
  if (hasTauri()) {
    let body: unknown
    if (opts && typeof opts.body === 'string') {
      try {
        body = JSON.parse(opts.body)
      } catch {
        body = undefined
      }
    }
    try {
      const method = ((opts && opts.method) || 'GET').toUpperCase()
      const market = marketFor(pathname)
      const lang = getLocale()
      const run = () => millidaApi<T>(pathname, method, body, market, lang)
      return await (method === 'GET' ? sharedGet(pathname, (market ?? '') + '|' + (lang ?? ''), run) : run())
    } catch (e) {
      if (String(e).includes('unauthorized')) window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
      throw e
    }
  }
  // Демо-просмотр в браузере (?preview=user, только dev): подменяем лишь то,
  // что сервер отдаёт вошедшему. Для всего остального ответа нет, и запрос
  // уходит на прод живым — рейтинг, каталог, тарифы и цены остаются настоящими.
  if (import.meta.env.DEV && (DEMO_USER || ECONOMY_SHOWCASE)) {
    const demo = demoAnswer(pathname, opts)
    if (demo) return (await import('./demoText')).localizeDemoAnswer((await demo) as T)
  }
  const market = marketFor(pathname)
  const lang = getLocale()
  const run = async (): Promise<T> => {
    const r = await fetch(LAUNCHER_API + pathname, {
      ...opts,
      headers: {
        ...apiHeaders(),
        ...(market ? { 'X-Market': market } : {}),
        ...((opts && (opts.headers as Record<string, string>)) || {}),
      },
    })
    if (!r.ok) {
      const body = await r.json().catch(() => null)
      throw new Error(shortfallMarker(body) ?? 'http ' + r.status)
    }
    return r.json()
  }
  return !opts || !opts.method || opts.method.toUpperCase() === 'GET'
    ? opts && opts.headers
      ? hedged(run)
      : sharedGet(pathname, (market ?? '') + '|' + (lang ?? ''), run)
    : run()
}

const SHARED_GET = /^\/(?:hosting|vds)\//
const inflightGets = new Map<string, Promise<unknown>>()

/**
 * Хостинг: список и карточка сервера просят одни и те же адреса из нескольких мест сразу (родной экран,
 * экран с сайта, прогрев при наведении). Пока первый запрос в пути, остальные ждут его ответ, а не шлют свой.
 */
export function sharedGet<T>(pathname: string, variant: string, run: () => Promise<T>): Promise<T> {
  if (!SHARED_GET.test(pathname)) return hedged(run)
  const key = variant + '|' + pathname
  const live = inflightGets.get(key)
  if (live) return live as Promise<T>
  const p = hedged(run).finally(() => inflightGets.delete(key))
  inflightGets.set(key, p)
  return p
}

/** Через сколько без ответа уходит второй такой же запрос. */
export const HEDGE_AFTER_MS = 6_000

/**
 * Запрос на чтение, который не зависает из-за одного зависшего соединения:
 * нет ответа за 6 с — уходит второй такой же, берём первый успешный. Щит
 * перед API (12.10.2026) подвешивал примерно каждое 6–10-е соединение на
 * 1–18 с: списки висели на скелетах, а в «Добавить моды» не появлялись версии
 * и кнопка «Выбрать» оставалась выключенной. Быстрая ошибка возвращается
 * сразу, как раньше; повторяются только GET.
 */
export function hedged<T>(run: () => Promise<T>, afterMs = HEDGE_AFTER_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let done = false
    let pending = 0
    let timer = 0
    const start = () => {
      pending++
      run().then(
        (v) => {
          if (done) return
          done = true
          clearTimeout(timer)
          resolve(v)
        },
        (e) => {
          pending--
          if (done || pending > 0) return
          done = true
          clearTimeout(timer)
          reject(e)
        },
      )
    }
    timer = setTimeout(() => {
      if (!done) start()
    }, afterMs) as unknown as number
    start()
  })
}

export function openExt(u: string) {
  if (hasTauri()) openUrl(u)
  else window.open(u, '_blank')
}

function millidaServicesEnabled(): boolean { return false }
