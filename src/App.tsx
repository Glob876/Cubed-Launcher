import { lazy, Suspense, useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { SvgSprite } from './components/SvgSprite'
import { Titlebar } from './components/Titlebar'
import { Toast, LaunchToast } from './components/Toast'
import { ConfirmModal } from './components/ConfirmModal'
import { Builds } from './screens/Builds'
import { ImportModal } from './modals/Import'
import { MoveBuildsModal } from './modals/MoveBuilds'
import { BuildPicker } from './components/BuildPicker'
import { DepPlanModal } from './components/DepPlanModal'
import { Installs } from './components/Installs'
import { ImageLightbox } from './components/ImageLightbox'
import { ModpackVersionsOverlay, ScreenshotsOverlay } from './modals/Overlays'
import { CubedCatalog } from './screens/CubedCatalog'
import { initInstalls } from './state/installs'
import { getAccount, useAccounts } from './state/accounts'
import { startMsLogin, cancelMsLogin, copyMsCode, openMsVerifyPage, refreshMsAccounts, useMsLogin } from './state/msLogin'
import { initSecrets } from './lib/secure'
import { hydratePrefs, flushPrefs } from './lib/prefs'
import { initTelemetry } from './lib/telemetry'
import { initAccent } from './lib/accent'
import { initDensity } from './lib/density'
import { hideBoot } from './lib/boot'
import { frontendReady } from './ipc/commands'
import { listenGameExit, listenGameCrash, listenLaunchWarning } from './ipc/events'
import { syncRunningGame, useGame } from './state/game'
import { useCrash } from './state/crash'
import { refreshProfiles } from './state/profiles'
import { openModal, showToast, useUi } from './state/ui'
import { initTray, restoreLauncher, restoreOnGameExit } from './lib/window'
import { CubedHome, Appearance } from './screens/CubedHome'
import './styles/cubed.css'
const InstancePage = lazy(() => import('./modals/InstancePage').then(m => ({ default: m.InstancePage })))
const ProjectModal = lazy(() => import('./modals/Project').then(m => ({ default: m.ProjectModal })))
const NewBuildModal = lazy(() => import('./modals/NewBuild').then(m => ({ default: m.NewBuildModal })))
const CrashModal = lazy(() => import('./components/CrashModal').then(m => ({ default: m.CrashModal })))

function MicrosoftAccount() {
  const login = useMsLogin()
  const accounts = useAccounts(s => s.list)
  const active = useAccounts(s => s.active)
  return <section className="cubed-panel">
    <h1>Аккаунт Microsoft</h1>
    <p>Для игры нужна Minecraft: Java Edition на твоём аккаунте Microsoft.</p>
    {accounts.filter(a => a.kind === 'microsoft').map(a => <div className="cubed-row" key={a.id}>
      <button className={'btn md ' + (active === a.id ? 'primary' : 'secondary')} onClick={() => useAccounts.getState().setActive(a.id)}>{a.nick}</button>
      <button className="btn md secondary" onClick={() => useAccounts.getState().remove(a.id)}>Выйти</button>
    </div>)}
    <button className="btn lg primary" disabled={login.busy} onClick={() => void startMsLogin()}>Войти через Microsoft</button>
    {login.hint && <p role="status">{login.hint}</p>}
    {login.userCode && <div className="cubed-row"><strong>{login.userCode}</strong><button className="btn md secondary" onClick={() => void copyMsCode()}>Скопировать код</button><button className="btn md secondary" onClick={openMsVerifyPage}>Открыть Microsoft</button></div>}
    {login.busy && <button className="btn md secondary" onClick={cancelMsLogin}>Отмена</button>}
  </section>
}


function Settings() {
  const [clientId, setClientId] = useState('')
  useEffect(() => { void invoke<string>('cubed_microsoft_client_id').then(setClientId).catch(e => showToast(String(e), 'error')) }, [])
  return <section className="cubed-panel"><h1>Настройки</h1><Appearance /><h2>Вход Microsoft</h2>
    <p>Для Cubed Launcher требуется собственная регистрация приложения Microsoft. Client ID — публичный идентификатор приложения, не пароль аккаунта.</p>
    <label>Client ID приложения<input value={clientId} onChange={e => setClientId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></label>
    <button className="btn md primary" onClick={() => void invoke('cubed_set_microsoft_client_id', { clientId }).then(() => showToast('Сохранено')).catch(e => showToast(String(e), 'error'))}>Сохранить</button>
    <p>Версию Java, память и параметры запуска можно менять в настройках каждой сборки.</p>
    <p>Cubed Launcher — форк Millida Launcher. GPL-3.0-only.</p>
  </section>
}

export function App() {
  const screen = useUi(s => s.screen)
  const [accountOpen, setAccountOpen] = useState(false)
  const accounts = useAccounts(s => s.list)
  const instanceOpen = useUi(s => s.modals.bsModal.open || s.modals.bsModal.vis)
  const projectOpen = useUi(s => s.modals.pjModal.open || s.modals.pjModal.vis)
  const newOpen = useUi(s => s.modals.nbModal.open || s.modals.nbModal.vis)
  const crashOpen = useCrash(s => !!s.info)
  useEffect(() => {
    let disposed = false
    const off: Array<() => void> = []
    const keep = (u: (() => void) | null) => { if (u) disposed ? u() : off.push(u) }
    void frontendReady(); initTray(); initInstalls(); void initAccent(); void initDensity()
    void Promise.all([initSecrets(), hydratePrefs()]).then(async () => {
      useAccounts.getState().list.filter(a => a.kind !== 'microsoft').forEach(a => useAccounts.getState().remove(a.id))
      setAccountOpen(!useAccounts.getState().list.some(a => a.kind === 'microsoft'))
      useUi.getState().setLogged(true)
      useUi.getState().setScreen('play')
      await refreshProfiles(); syncRunningGame(); void refreshMsAccounts(); void initTelemetry(0)
    }).catch(e => showToast(String(e), 'error')).finally(hideBoot)
    void listenGameExit(profile => { useGame.getState().removeRunning(profile); void refreshProfiles(); if (restoreOnGameExit()) restoreLauncher() }).then(keep)
    void listenGameCrash(info => useCrash.getState().show(info)).then(keep)
    void listenLaunchWarning(msg => showToast(msg, 'error')).then(keep)
    const refresh = setInterval(() => void refreshMsAccounts(), 1_800_000)
    const openAccount = () => setAccountOpen(true)
    window.addEventListener('cubed-open-account',openAccount)
    const save = () => void flushPrefs()
    window.addEventListener('pagehide', save)
    return () => { disposed = true; window.removeEventListener('cubed-open-account',openAccount); off.forEach(u => u()); clearInterval(refresh); window.removeEventListener('pagehide', save) }
  }, [])
  const nav = (s: 'play' | 'builds' | 'mods' | 'settings') => { setAccountOpen(false); useUi.getState().setScreen(s) }
  return <><SvgSprite /><div className="window" id="win"><Titlebar /><div className="cubed-shell">
    <nav className="cubed-nav" aria-label="Разделы">
      <strong>Cubed Launcher</strong>
      <button className="btn md secondary" onClick={() => { setAccountOpen(true); cancelMsLogin() }}>{getAccount()?.nick || 'Войти через Microsoft'}</button>
      <button className={'btn md ' + (screen === 'play' && !accountOpen ? 'primary' : 'secondary')} onClick={() => nav('play')}>Играть</button>
      <button className={'btn md ' + (screen === 'builds' && !accountOpen ? 'primary' : 'secondary')} onClick={() => nav('builds')}>Мои сборки</button>
      <button className={'btn md ' + (screen === 'mods' && !accountOpen ? 'primary' : 'secondary')} onClick={() => nav('mods')}>Modrinth</button>
      <button className="btn md secondary" onClick={() => nav('settings')}>Настройки</button>
      <span className="cubed-nav-bottom">{accounts.length ? `${accounts.length} аккаунт(а) Microsoft` : 'Microsoft не подключён'}</span>
    </nav>
    <main className={"content cubed-content"+(screen === 'play' && !accountOpen ? ' cubed-home-content' : '')}>{accountOpen ? <MicrosoftAccount /> : screen === 'play' ? <CubedHome /> : screen === 'settings' ? <Settings /> : screen === 'mods' ? <CubedCatalog /> : <><div className="cubed-row"><button className="btn md primary" onClick={() => openModal('nbModal')}>Создать сборку</button><button className="btn md secondary" onClick={() => openModal('impModal')}>Импортировать</button></div><Builds on /></>}</main>
    </div><Suspense fallback={null}>{instanceOpen && <InstancePage />}{projectOpen && <ProjectModal />}{newOpen && <NewBuildModal />}{crashOpen && <CrashModal />}</Suspense>
    <ImportModal /><MoveBuildsModal /><BuildPicker /><DepPlanModal /><ScreenshotsOverlay /><ModpackVersionsOverlay /><ImageLightbox /><ConfirmModal /><Installs /><LaunchToast /><Toast />
  </div></>
}
