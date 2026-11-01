import { getAccount } from '../state/accounts'
import { hasTauri } from '../ipc/tauri'
import { msProfile } from '../ipc/commands'
let fallback = ''
export function defaultCubedSkin(): string {
  if (fallback) return fallback
  const canvas=document.createElement('canvas'); canvas.width=64; canvas.height=64
  const c=canvas.getContext('2d')!
  c.fillStyle='#b88768';c.fillRect(0,0,64,64)
  c.fillStyle='#38281e';c.fillRect(0,0,32,8);c.fillRect(0,8,8,8);c.fillRect(24,8,8,8)
  c.fillStyle='#4b3a87';c.fillRect(9,11,2,1);c.fillRect(13,11,2,1)
  c.fillStyle='#67432d';c.fillRect(10,14,4,1)
  c.fillStyle='#27858d';c.fillRect(16,16,24,16);c.fillRect(40,16,16,4);c.fillRect(32,48,16,4)
  c.fillStyle='#3d4291';c.fillRect(0,16,16,16);c.fillRect(16,48,16,16)
  c.clearRect(32,0,32,16);c.clearRect(0,32,64,16);c.clearRect(0,48,16,16);c.clearRect(48,48,16,16)
  fallback=canvas.toDataURL();return fallback
}
let skinKey='',pending:Promise<{skin:string;slim:boolean;cape:string|null}>|null=null
export function microsoftLook() {
  const account=getAccount()
  if (!account || account.kind !== 'microsoft' || !hasTauri()) return Promise.resolve({skin:defaultCubedSkin(),slim:false,cape:null})
  if (skinKey !== account.id || !pending) {
    skinKey=account.id
    pending=msProfile(account.id).then(p=>({skin:p.skin || defaultCubedSkin(),slim:p.slim,cape:p.capes.find(c=>c.active)?.url || null})).catch(()=>({skin:defaultCubedSkin(),slim:false,cape:null}))
  }
  return pending
}
