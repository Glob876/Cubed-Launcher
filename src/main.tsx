// Первым: до модулей, которые читают адрес API при импорте.
import './preview'
import { createRoot } from 'react-dom/client'
import { hasChosenLocale, setLocale } from './i18n'
import './styles/01-base.css'
import './styles/02-kit.css'
import './styles/03-mods.css'
import './styles/04-hosting.css'
import './styles/05-media.css'
import './styles/06-onboarding.css'
import './styles/07-density.css'
import './styles/09-wide.css'
import './styles/10-call.css'
import './styles/11-rooms.css'
import './styles/12-pixel.css'
// Экранные дополнения пиксельного языка: по файлу на зону (docs/PIXEL-LANGUAGE.md).
// Импорты явные, а не glob: glob-импорты Vite поднимает НАД остальными,
// и кит перебивал эти правила (22.09.2026).
import './styles/pixel/builds.css'
import './styles/pixel/first-run.css'
import './styles/pixel/catalog.css'
import './styles/pixel/hosting-settings.css'
import './styles/pixel/premium.css'
import './styles/pixel/rail.css'
import './styles/pixel/shop.css'
import './styles/pixel/settings.css'
import './styles/pixel/shell.css'
import './styles/pixel/social.css'
import { App } from './App'
import './styles/pixel/premium-theme.css'
import './styles/classic.css'
import { openExt } from './lib/api'
import { initRenderGate } from './lib/renderGate'
import { initJankWatch } from './lib/jank'
import { webviewFailure } from './lib/webviewHealth'
import { installAspectRatioFallback } from './lib/aspectRatioFallback'
import { installBrokenImageGuard } from './lib/brokenImages'

if (!import.meta.env.DEV) {
  document.addEventListener('contextmenu', (e) => {
    const t = e.target as HTMLElement | null
    if (t && t.closest('input, textarea, [contenteditable="true"]')) return
    e.preventDefault()
  })
}

// Любая внешняя ссылка, которую не перехватил сам компонент, открывается в
// браузере: иначе окно лаунчера уходит на чужой сайт (аудит 24.09.2026).
document.addEventListener('click', (e) => {
  if (e.defaultPrevented) return
  const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
  if (!a || !/^https?:/i.test(a.getAttribute('href') || '')) return
  e.preventDefault()
  openExt(a.href)
})

if (!hasChosenLocale()) void setLocale('ru')
initRenderGate()
initJankWatch()
void webviewFailure()

installAspectRatioFallback()
installBrokenImageGuard()

createRoot(document.getElementById('root')!).render(<App />)
