import { useRef, useState } from 'react'
import { Icon } from './Icon'
import { AccountMenu } from './AccountMenu'
import { Head } from './Head'
import { useAccounts } from '../state/accounts'
import { useUi } from '../state/ui'
import type { ScreenId } from '../state/ui'
import { t, useT } from '../i18n'

/** hub: раздел «Во что играем» — false «Мои сборки» (сборки и рекомендации), true «Каталог». */
const NAV: { id: ScreenId; icon: string; label: string }[] = [
 {id:'play',icon:'i-play',get label(){return t('Играть')}},
 {id:'builds',icon:'i-box2',get label(){return t('Мои сборки')}},
 {id:'mods',icon:'i-blocks',label:'Modrinth'},
]




export function ClassicSidebar({ onNav }: { onNav: (s: ScreenId) => void }) {
  const t = useT()
  const screen = useUi(s => s.screen)
  const acc = useAccounts(s => s.list.find(a => a.id === s.active))
  const chipRef=useRef<HTMLDivElement>(null)
  const [menuOpen,setMenuOpen]=useState(false)
  return <aside className="sidebar"><div className="side-logo"><img src="/cubed-logo.svg" width={32} height={32} alt="" /><span>Cubed Launcher</span></div>
    <nav className="nav-group">{NAV.filter(n => ['play','builds','mods'].includes(n.id)).map(n => <button key={n.id} className={'nav-item'+(screen === n.id?' active':'')} onClick={() => onNav(n.id)}><Icon id={n.icon} /><span className="nav-label">{n.label}</span></button>)}</nav>
    <div className="side-spacer" /><nav className="nav-group nav-group-bottom"><button className="nav-item" onClick={() => onNav('settings')}><Icon id="i-settings" /><span className="nav-label">{t('Настройки')}</span></button></nav>
    <div className="side-sep" /><div className="account" ref={chipRef} onClick={() => setMenuOpen(v => !v)}><Head nick={acc?.nick} kind={acc?.kind} src={acc?.avatar} size={40} /><span>{acc?.nick || t('Войти')}<small>Microsoft</small></span><Icon id="i-chev-d" /></div>
    <AccountMenu open={menuOpen} onClose={() => setMenuOpen(false)} chipRef={chipRef} />
  </aside>
}
