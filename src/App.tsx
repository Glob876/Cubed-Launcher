import { useSlidingSegs } from './lib/slidingSegs'
import { modalToClose, openLayers } from './lib/escClose'
import { closeModal } from './state/ui'
import { lazy, Suspense, useEffect, useState } from 'react'
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
import { useAccounts } from './state/accounts'
import { refreshMsAccounts } from './state/msLogin'
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
import { showToast, useUi } from './state/ui'
import { initTray, restoreLauncher, restoreOnGameExit } from './lib/window'
import { Play } from './screens/Play'
import { ClassicHome } from './screens/ClassicHome'
import { Sidebar } from './components/Sidebar'
import { ClassicSidebar } from './components/ClassicSidebar'
import { useLayout } from './state/layout'
import { useHubTab } from './components/playhub/hubTab'
import { MicrosoftAccount } from './components/CubedMicrosoft'
import { Settings } from './modals/Settings'
import './styles/fork.css'
const InstancePage = lazy(() => import('./modals/InstancePage').then(m => ({ default: m.InstancePage })))
const ProjectModal = lazy(() => import('./modals/Project').then(m => ({ default: m.ProjectModal })))
const NewBuildModal = lazy(() => import('./modals/NewBuild').then(m => ({ default: m.NewBuildModal })))
const CrashModal = lazy(() => import('./components/CrashModal').then(m => ({ default: m.CrashModal })))


export function App() {
  useSlidingSegs()
  const screen = useUi(s => s.screen)
  const classic = useLayout(s => s.layout === 'classic')
  const catalogTab = useHubTab(s => s.all)
  const [accountOpen, setAccountOpen] = useState(false)
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
      setAccountOpen(false)
      useUi.getState().setLogged(true)
      useUi.getState().setScreen('play')
      await refreshProfiles(); syncRunningGame(); void refreshMsAccounts(); void initTelemetry(0)
    }).catch(e => showToast(String(e), 'error')).finally(hideBoot)
    void listenGameExit(profile => { useGame.getState().removeRunning(profile); void refreshProfiles(); if (restoreOnGameExit()) restoreLauncher() }).then(keep)
    void listenGameCrash(info => useCrash.getState().show(info)).then(keep)
    void listenLaunchWarning(msg => showToast(msg, 'error')).then(keep)
    const refresh = setInterval(() => void refreshMsAccounts(), 1_800_000)
    const openAccount = () => {setAccountOpen(true);useUi.getState().setScreen('settings')}
    const escape = (event: KeyboardEvent) => {if(event.key === 'Escape' && !event.defaultPrevented){const modal=modalToClose(openLayers());if(modal) closeModal(modal)}}
    document.addEventListener('keydown',escape)
    window.addEventListener('cubed-open-account',openAccount)
    const save = () => void flushPrefs()
    window.addEventListener('pagehide', save)
    return () => { disposed = true; document.removeEventListener('keydown',escape); window.removeEventListener('cubed-open-account',openAccount); off.forEach(u => u()); clearInterval(refresh); window.removeEventListener('pagehide', save) }
  }, [])
  const nav = (s: import('./state/ui').ScreenId) => { setAccountOpen(false); useUi.getState().setScreen(s) }
  return <><SvgSprite /><div className="window" id="win"><Titlebar />
    <div className="app" id="scr-app" style={{display:'flex'}}>
      {classic ? <ClassicSidebar onNav={nav} /> : <Sidebar onNav={nav} />}
      <main className="content">
        {accountOpen ? <section className="screen on" id="s-account"><div className="s2"><MicrosoftAccount /></div></section> : screen === 'play' ? (classic ? <ClassicHome on /> : <Play on />) : screen === 'settings' ? <Settings on /> : screen === 'mods' || (screen === 'playhub' && catalogTab) ? <section className="screen on" id="s-mods"><CubedCatalog /></section> : <Builds on />}
      </main>
    </div><Suspense fallback={null}>{instanceOpen && <InstancePage />}{projectOpen && <ProjectModal />}{newOpen && <NewBuildModal />}{crashOpen && <CrashModal />}</Suspense>
    <ImportModal /><MoveBuildsModal /><BuildPicker /><DepPlanModal /><ScreenshotsOverlay /><ModpackVersionsOverlay /><ImageLightbox /><ConfirmModal /><Installs /><LaunchToast /><Toast />
  </div></>
}
