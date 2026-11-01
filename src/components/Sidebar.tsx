import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import { AccountMenu } from './AccountMenu'
import { Head } from './Head'
import { useAccounts } from '../state/accounts'
import { radioOn, useMusic } from '../state/music'
import { playSound, setSoundMode, soundMode, soundVolume } from '../lib/sound'
import { writePref } from '../lib/prefs'
import { Slider } from './Slider'
import { PxIcon } from './PxIcon'
import { openCatalogHome, useHubTab } from './playhub/hubTab'
import { useUi } from '../state/ui'
import type { ScreenId } from '../state/ui'
import { useT } from '../i18n'

/* Навигация как в Brawl Stars: у каждого раздела ровно один вход (владелец
   23.09.2026: «всё дублируется»). В лобби вкладок нет — разделы живут на сцене,
   здесь только кошелёк, настройки и аккаунт в углу. На остальных экранах —
   шапка с «← Лобби» и ходом запуска. Имя компонента осталось Sidebar, чтобы не
   трогать раскладку App.tsx. */
/** Две квадратные кнопки лобби: звуки интерфейса и музыка (по умолчанию играет). */
/**
 * Быстрый звук под шестерёнкой (владелец 12.10.2026: «музыку и звуки — в
 * настройки, но чтобы школьник нашёл»). Кнопок звука и музыки в полосе больше
 * нет: всё живёт в «Настройки → Звук», а навёл на шестерёнку — выключил или
 * убавил, не заходя.
 */
function QuickSound() {
  const t = useT()
  const music = useMusic((s) => radioOn(s))
  const musicLevel = useMusic((s) => s.level)
  const setMusicLevel = useMusic((s) => s.setVolume)
  const toggleMusic = useMusic((s) => s.toggleRadio)
  const [sfxLevel, setSfxLevel] = useState(soundVolume)
  const [ui, setUi] = useState(() => soundMode() === 'all')
  useEffect(() => {
    const sync = () => {
      setUi(soundMode() === 'all')
      setSfxLevel(soundVolume())
    }
    window.addEventListener('focus', sync)
    return () => window.removeEventListener('focus', sync)
  }, [])
  return (
    <span className="lb-vol-pop lb-quick-pop" role="group" aria-label={t('Звук')}>
      <span className="lb-vol-card lb-quick-card">
        <span className="lb-quick-row">
          <button
            className={'lb-quick-tg' + (ui ? '' : ' off')}
            aria-pressed={ui}
            aria-label={ui ? t('Выключить звуки') : t('Включить звуки')}
            data-track={ui ? 'sound_off' : 'sound_on'}
            data-notip
            data-nosound
            onClick={() => {
              const next = !ui
              setSoundMode(next ? 'all' : 'notify')
              setUi(next)
              if (next) playSound('click')
            }}
          >
            <Icon id={ui ? 'i-volume' : 'i-mute'} />
          </button>
          <Slider
            value={sfxLevel}
            min={0}
            max={100}
            width={130}
            onChange={(v) => {
              setSfxLevel(v)
              writePref('m-sound-vol', String(v))
              playSound('click')
            }}
          />
          <b>{sfxLevel + '%'}</b>
        </span>
        <span className="lb-quick-row">
          <button
            className={'lb-quick-tg' + (music ? '' : ' off')}
            aria-pressed={music}
            aria-label={music ? t('Выключить музыку') : t('Включить музыку')}
            data-track={music ? 'music_off' : 'music_on'}
            data-notip
            onClick={() => toggleMusic()}
          >
            <Icon id={music ? 'i-music' : 'i-music-off'} />
          </button>
          <Slider value={musicLevel} min={0} max={100} width={130} onChange={setMusicLevel} />
          <b>{musicLevel + '%'}</b>
        </span>
      </span>
    </span>
  )
}

/** Вкладки хаба в верхней полосе: библиотека (во что играть) и ресурсы (каталог). */
/** libLabel — «Мои сборки» в раскладке «Классика», где так же назван пункт панели. */
export function HubTopTabs({ libLabel }: { libLabel?: string }) {
  const t = useT()
  const all = useHubTab((s) => s.all)
  const setAll = useHubTab((s) => s.setAll)
  const go = (v: boolean) => {
    if (v === all) return
    if (v) openCatalogHome()
    else setAll(v)
    const c = document.querySelector('.content')
    if (c) c.scrollTop = 0
  }
  return (
    <div className="tb-tabs" role="tablist" aria-label={t('Во что играем')}>
      <button role="tab" aria-selected={!all} className={'btn md tb-tab ' + (!all ? 'primary on' : 'secondary')} data-sound="nav" data-track="hub_tab_library" onClick={() => go(false)}>
        {/* Библиотека — книжная полка, не сундук (владелец 10.10.2026). */}
        <img className="tb-tab-block" src="/block-icons/Block52Millida.png" alt="" width={26} height={26} draggable={false} /> {libLabel ?? t('Библиотека')}
      </button>
      <button role="tab" aria-selected={all} className={'btn md tb-tab ' + (all ? 'primary on' : 'secondary')} data-sound="nav" data-track="hub_tab_resources" onClick={() => go(true)}>
        <PxIcon name="book" size={30} /> {t('Каталог')}
      </button>
    </div>
  )
}

export function Sidebar({ onNav }: { onNav: (s: ScreenId) => void }) {
  const t = useT()
  const screen = useUi(s => s.screen)
  const acc = useAccounts(s => s.list.find(a => a.id === s.active))
  const chipRef = useRef<HTMLDivElement>(null)
  const [menuOpen,setMenuOpen] = useState(false)
  return <header className={'topbar'+(screen === 'play' ? ' is-lobby' : '')}>
    {screen !== 'play' && <button className="tb-back" onClick={() => onNav('play')}><Icon id="i-chev-l" />{t('Лобби')}</button>}
    <div className="lb-btns">
      <div className="lb-btn lb-acc account" role="button" tabIndex={0} aria-label={t('Аккаунты')} ref={chipRef} onClick={() => setMenuOpen(v => !v)}>
        <span className="ava"><Head nick={acc?.nick} kind={acc?.kind} src={acc?.avatar} size={56} /></span>
        <span className="lb-acc-txt"><span className="acc-nick-row"><span className="acc-nick">{acc?.nick || t('Гость')}</span></span><i>Microsoft</i></span><Icon id="i-chev-d" />
      </div>
      <span className="lb-vol lb-quick"><button className="lb-btn" aria-label={t('Настройки')} onClick={() => onNav('settings')}><Icon id="i-settings" /></button><QuickSound /></span>
    </div><AccountMenu open={menuOpen} onClose={() => setMenuOpen(false)} chipRef={chipRef} />
  </header>
}
