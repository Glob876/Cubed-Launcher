// What happens after login: loading the profile, wallet, friends, modpacks. Requests go to the Millida API through api(), the core adds the token.
import { api, hasMillidaAccount } from './api'
import { MILLIDA_USER_KEY, useAccounts } from '../state/accounts'
import { syncAuth } from '../state/auth'
import { refreshProfiles } from '../state/profiles'
import { refreshGameNick } from '../state/gameNick'
import { useUi } from '../state/ui'
import { hasTauri } from '../ipc/tauri'
import { millidaLogout } from '../ipc/commands'
import { refreshSessionState } from './secure'
import { usePrivacy } from './privacy'
import { refreshMoney, resetMoney } from './useMoney'

export interface MillidaProfile {
  nickname?: string
  avatarUrl?: string
}

export let MILLIDA_PROFILE: MillidaProfile | null = null

export async function loadMillidaProfile(): Promise<MillidaProfile | null> {
  if (!hasMillidaAccount()) return null
  try {
    const [me] = await Promise.all([api<MillidaProfile>('/users/me'), refreshMoney()])
    MILLIDA_PROFILE = me
    const { list, save } = useAccounts.getState()
    const i = list.findIndex((x) => x.kind === 'millida' || x.kind === 'tg')
    if (i >= 0 && me.nickname) {
      const l = list.slice()
      l[i] = { ...l[i], nick: me.nickname }
      save(l)
    }
    return me
  } catch {
    return null
  }
}

export function enterApp() {
  useUi.getState().setLogged(true)
  syncAuth()
  void refreshProfiles()
  void refreshGameNick()
}

function dropMillidaSession() {
  MILLIDA_PROFILE = null
  localStorage.removeItem(MILLIDA_USER_KEY)
  // Приватность привязана к аккаунту: следующий вход не должен видеть чужие
  // тумблеры до ответа сервера.
  usePrivacy.setState({ loaded: false, error: '', saving: null })
  resetMoney()
  if (!hasTauri()) return
  void millidaLogout()
    .catch(() => {})
    .then(() => refreshSessionState())
}

export function forgetMillidaIfGone() {
  const has = useAccounts.getState().list.some((a) => a.kind === 'millida' || a.kind === 'tg')
  if (has) return
  dropMillidaSession()
}

export function logoutToLogin() {
  dropMillidaSession()
  // Убираем сам аккаунт Millida/TG из списка: иначе при следующем запуске
  // getAccount() снова true → enterApp() поднимает залогиненную оболочку без
  // токена (кошелёк/друзья/хостинг молча мертвы, вернуться на вход нельзя).
  // Microsoft/офлайн-аккаунты не трогаем — у них свои токены.
  const acc = useAccounts.getState()
  acc.list
    .filter((a) => a.kind === 'millida' || a.kind === 'tg')
    .forEach((a) => acc.remove(a.id))
  useUi.getState().setLogged(false)
  syncAuth()
  void refreshGameNick()
}
