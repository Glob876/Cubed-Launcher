import { useEffect, useRef, useState } from 'react'
import { SCENES, W, H } from '../lib/wallpaper'
import { WpThumb } from '../components/HeroWallpaper'
import { useWallpaper } from '../state/wallpaper'
import { convertFileSrc, pickWallpaper } from '../ipc/commands'
import { useProfiles } from '../state/profiles'
import { useGame, stopRunningGame } from '../state/game'
import { getAccount } from '../state/accounts'
import { useUi, openModal, showToast } from '../state/ui'
import { startPrelaunch, cancelPrelaunch } from '../lib/launch'
import { playButtonState } from '../lib/launchView'
import { BuildIcon } from '../components/playhub/BuildIcon'
import { accentFromHex, computeAccent, paintAccent, saveAccent, withColorFade } from '../lib/accent'
import { onRenderGate, renderLive } from '../lib/renderGate'

const IDS = ['taiga', 'sunset', 'cave', 'end']
function sceneOf(id: string) { return SCENES[id] ? id : 'taiga' }

export function Appearance() {
  const wp = useWallpaper()
  const [color, setColor] = useState(() => { try { return JSON.parse(localStorage.getItem('m-accent') || '{}').c || '#61c541' } catch { return '#61c541' } })
  return <section className="cubed-appearance"><h2>Оформление</h2>
    <div className="cubed-row"><label>Цвет интерфейса<input aria-label="Цвет интерфейса" type="color" value={color} onChange={e => {
      setColor(e.target.value)
      const a = computeAccent(accentFromHex(e.target.value))
      withColorFade(() => { paintAccent(a); saveAccent(a) })
    }} /></label>
    {['#61c541','#65a4ed','#bc83ed','#ecad57','#df737e','#72c3b4'].map(c => <button key={c} className="cubed-swatch" aria-label={'Цвет '+c} style={{background:c}} onClick={() => {
      setColor(c); const a = computeAccent(accentFromHex(c)); withColorFade(() => { paintAccent(a); saveAccent(a) })
    }} />)}</div>
    <h3>Фон главной страницы</h3><div className="cubed-wallpapers">{IDS.map(id => <button className={'cubed-wallpaper '+(sceneOf(wp.wpCur) === id && wp.wpCur !== 'custom' ? 'selected' : '')} key={id} aria-pressed={wp.wpCur === id} onClick={() => wp.pick(id,SCENES[id].name)}><WpThumb scene={id} /><span>{SCENES[id].name}</span></button>)}</div>
    <div className="cubed-row"><button className="btn md secondary" onClick={() => void pickWallpaper().then(file => { if (file) wp.addCustom(file) }).catch(e => showToast(String(e),'error'))}>Выбрать своё изображение или видео</button>
      <button className="btn md secondary" aria-pressed={wp.wpAnimOn} onClick={wp.toggleAnim}>Анимация: {wp.wpAnimOn ? 'включена' : 'выключена'}</button></div>
    {wp.gallery.map(file => <div className="cubed-row" key={file.path}><button className="btn md secondary" onClick={() => wp.setCustom(file)}>{file.name || 'Свой фон'}</button><button className="btn sm ghost" onClick={() => wp.removeCustom(file.path)}>Убрать</button></div>)}
  </section>
}

export function CubedHome() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const wp = useWallpaper()
  const profiles = useProfiles(s => s.profiles)
  const selected = useProfiles(s => s.selected)
  const running = useGame(s => s.list)
  const prelaunch = useUi(s => s.prelaunch)
  const profile = profiles.find(p => p.name === selected) || profiles[0]
  const btn = playButtonState({modeKind:'build',selected:profile?.name || null,running,prelaunch})
  const custom = wp.wpCur === 'custom' && wp.custom ? wp.custom : null
  useEffect(() => {
    const c = canvas.current; const ctx = c?.getContext('2d'); if (!ctx) return
    let frame = 0, last = 0
    const scene = SCENES[sceneOf(wp.wpCur)]
    const paint = (time: number) => {
      if (!custom && (time - last > 32 || !last) && renderLive()) { scene.draw(ctx,wp.wpAnimOn ? time/1000 : 10,0,0); last = time }
      if (wp.wpAnimOn && !custom) frame = requestAnimationFrame(paint)
    }
    scene.draw(ctx,10,0,0)
    frame = requestAnimationFrame(paint)
    const syncVideo = () => { if (video.current) { if (renderLive() && wp.wpAnimOn) void video.current.play().catch(() => {}); else video.current.pause() } }
    const off = onRenderGate(syncVideo); syncVideo()
    return () => { cancelAnimationFrame(frame); off() }
  }, [wp.wpCur,wp.wpAnimOn,custom?.path])
  useEffect(() => {
    const v = video.current
    if (!v) return
    const sync = () => { if (wp.wpAnimOn && renderLive()) void v.play().catch(() => {}); else v.pause() }
    const off = onRenderGate(sync); sync()
    return off
  }, [custom?.path,wp.wpAnimOn])
  const play = () => {
    if (!profile) { openModal('nbModal'); return }
    if (btn.kind === 'stop') { stopRunningGame(profile.name); return }
    if (getAccount()?.kind !== 'microsoft') { window.dispatchEvent(new Event('cubed-open-account')); return }
    useProfiles.getState().setSelected(profile.name)
    startPrelaunch(profile.name)
  }
  return <section className="cubed-home" aria-label="Главная">
    <div className="cubed-home-background" key={custom?.path || wp.wpCur}>
      {custom ? custom.kind === 'video' ? <video ref={video} src={convertFileSrc(custom.path)} muted loop playsInline autoPlay={wp.wpAnimOn} /> : <img src={convertFileSrc(custom.path)} alt="" /> : <canvas ref={canvas} width={W} height={H} />}
    </div><div className="cubed-home-shade" />
    <div className="cubed-home-top"><span>Cubed Launcher</span><button className="btn md secondary" onClick={() => useUi.getState().setScreen('settings')}>Оформление</button></div>
    <div className="cubed-home-play">
      {profile ? <BuildIcon icon={profile.icon} name={profile.name} size={64} /> : null}
      <label className="cubed-home-pick"><span>Выбранная сборка</span><select aria-label="Сборка для игры" value={profile?.name || ''} onChange={e => useProfiles.getState().setSelected(e.target.value)}>
        {!profiles.length && <option value="">Создай или скачай сборку</option>}{profiles.map(p => <option value={p.name} key={p.name}>{p.name} · {p.version}</option>)}
      </select><small>{profile ? `${profile.version} · ${profile.loader || (profile.fabric ? 'Fabric' : 'Vanilla')}` : 'Мои сборки → Создать сборку или Modrinth'}</small></label>
      <button className="btn lg primary cubed-play" disabled={btn.kind === 'installing'} onClick={play}>{btn.kind === 'installing' ? `${btn.stage} ${btn.pct}%` : btn.kind === 'stop' ? 'Остановить' : profile ? 'Играть' : 'Создать сборку'}</button>
      {btn.kind === 'installing' && <button className="btn md secondary" onClick={cancelPrelaunch}>Отменить</button>}
    </div>
  </section>
}
