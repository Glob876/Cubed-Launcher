import { useEffect, useRef } from 'react'
import { Icon } from '../components/Icon'
import { BuildIcon } from '../components/playhub/BuildIcon'
import { LobbyCharacter } from '../components/lobby/LobbyCharacter'
import { PixelField } from '../components/lobby/PixelField'
import { LobbyAmbience } from '../components/lobby/LobbyAmbience'
import { RunningGames } from '../components/lobby/RunningGames'
import { useProfiles } from '../state/profiles'
import { useGame, stopRunningGame } from '../state/game'
import { useUi, setScreen, openModal } from '../state/ui'
import { getAccount } from '../state/accounts'
import { startPrelaunch, cancelPrelaunch } from '../lib/launch'
import { playButtonState } from '../lib/launchView'
import { useWallpaper } from '../state/wallpaper'
import { SCENES, W, H } from '../lib/wallpaper'
import { convertFileSrc } from '../ipc/commands'
import { renderLive } from '../lib/renderGate'
import { useT } from '../i18n'
import '../styles/pixel/play.css'
import '../styles/pixel/lobby.css'
import '../styles/pixel/hubtile.css'

// Original lobby composition and CSS: scene, character, left navigation tiles,
// mode card and play button. Commercial and social slots are removed.
export function Play({ on }: { on: boolean }) {
  const t = useT()
  const profiles = useProfiles(s => s.profiles)
  const selected = useProfiles(s => s.selected)
  const running = useGame(s => s.list)
  const prelaunch = useUi(s => s.prelaunch)
  const wp = useWallpaper()
  const canvas = useRef<HTMLCanvasElement>(null)
  const profile = profiles.find(p => p.name === selected) || profiles[0]
  const btn = playButtonState({modeKind:'build',selected:profile?.name || null,running,prelaunch})
  const custom = wp.wpCur === 'custom' ? wp.custom : null
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    const scene = SCENES[wp.wpCur]
    if (!scene) return
    let frame = 0, last = 0
    const paint = (time: number) => {
      if (renderLive() && time-last > 32) { scene.draw(ctx,wp.wpAnimOn ? time/1000 : 10,0,0); last=time }
      if (on && wp.wpAnimOn) frame=requestAnimationFrame(paint)
    }
    scene.draw(ctx,10,0,0); frame=requestAnimationFrame(paint)
    return () => cancelAnimationFrame(frame)
  },[wp.wpCur,wp.wpAnimOn,on])
  const play = () => {
    if (btn.kind === 'installing') { cancelPrelaunch(); return }
    if (!profile) { openModal('nbModal'); return }
    if (btn.kind === 'stop') { stopRunningGame(profile.name); return }
    if (getAccount()?.kind !== 'microsoft') { window.dispatchEvent(new Event('cubed-open-account')); return }
    useProfiles.getState().setSelected(profile.name); startPrelaunch(profile.name)
  }
  return <section className={'screen lobby'+(on?' on':'')} id="s-play">
    <div className="hero-live-wrap lobby-wrap"><div className="hero-live" id="heroLive">
      {custom ? custom.kind === 'video' ? <video className="cubed-lobby-backdrop ready" src={convertFileSrc(custom.path)} autoPlay={wp.wpAnimOn && on} loop muted playsInline /> : <img className="cubed-lobby-backdrop ready" src={convertFileSrc(custom.path)} alt="" /> : SCENES[wp.wpCur] ? <canvas className="cubed-lobby-backdrop ready" ref={canvas} width={W} height={H} /> : <PixelField on={on} />}
      <LobbyAmbience on={on} />
    </div>
    <LobbyCharacter on={on} />
    <div className="lobby-left"><nav className="lobby-nav" aria-label={t('Разделы')}>
      {([['builds','i-box2',t('Мои сборки')],['mods','i-blocks','Modrinth']] as const).map(([id,icon,label]) => <button key={id} className={'ht ht-'+(id === 'builds'?'wardrobe':'server')} onClick={() => setScreen(id)}><span className="ht-frame" aria-hidden="true"><span className="ht-plate"><span className="ht-rays" /><span className="ht-edge-t" /></span></span><span className="ht-artbox" aria-hidden="true"><Icon id={icon} /></span><span className="ht-band"><b className="ht-title">{label}</b></span></button>)}
    </nav></div>
    <div className="lobby-side"><RunningGames /><div className="lobby-side-top"><span /><span className="lobby-tools" /></div>
      <div className="lobby-row"><button className="lobby-mode" onClick={() => setScreen('builds')}>
        <span className={'lobby-mode-card'+(profile?' kind-build':' empty')}><span className="lobby-mode-art"><span className="lobby-mode-cover lobby-mode-bi"><BuildIcon icon={profile?.icon} name={profile?.name} size={104} /></span></span>
          <span className="lobby-mode-body"><span className="lobby-mode-lab">{t('Сегодня играем')}</span><b>{profile?.name || t('Ещё не выбрано')}</b><span className="meta">{profile ? `${profile.loader || 'Vanilla'} · ${profile.version}` : t('Создай или скачай сборку')}</span><span className="lobby-mode-change">{t('Сменить сборку')}<Icon id="i-chev-r" /></span></span>
        </span>
      </button><div className="play-col"><button className={'btn lg '+(btn.kind === 'stop'?'stop':'primary')+(btn.kind === 'installing'?' loading':'')} id="playBtn" onClick={play}>
        <span className="fill" style={btn.kind === 'installing'?{width:btn.pct+'%'}:undefined} /><span className="lbl"><Icon id={btn.kind === 'stop'?'i-power':'i-play'} /><span id="playLbl">{btn.kind === 'installing'?`${btn.stage} ${btn.pct}%`:btn.kind === 'stop'?t('Остановить'):t('Играть')}</span></span>
      </button></div></div>
    </div>
  </div></section>
}
