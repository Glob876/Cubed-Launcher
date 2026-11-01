import { useEffect, useState } from 'react'
import { useCrash } from '../state/crash'
import { openProfileFolder } from '../ipc/commands'
import { runRepair } from '../lib/repair'
import { copyText } from '../lib/clipboard'
import { showToast } from '../state/ui'

export function CrashModal() {
  const { info, close } = useCrash()
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!info) return
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown',escape)
    return () => document.removeEventListener('keydown',escape)
  }, [info,close])
  if (!info) return null
  return <div className="cubed-crash-backdrop" role="dialog" aria-modal="true" aria-label="Игра завершилась с ошибкой"><div className="cubed-crash">
    <h2>Игра завершилась с ошибкой</h2><p>{info.profile}</p><p>{info.reason}</p>
    {info.cause && <p>{info.cause}</p>}
    <details><summary>Последние строки журнала</summary><pre>{info.tail}</pre></details>
    <div className="cubed-row">
      <button className="btn md primary" disabled={busy} onClick={() => {
        setBusy(true); void runRepair(info.profile).then(() => showToast('Проверка сборки завершена')).catch(e => showToast(String(e),'error')).finally(() => setBusy(false))
      }}>{busy ? 'Проверка…' : 'Починить сборку'}</button>
      <button className="btn md secondary" onClick={() => void openProfileFolder(info.profile).catch(e => showToast(String(e),'error'))}>Папка сборки</button>
      <button className="btn md secondary" onClick={() => void copyText(info.reason+'\n'+info.tail).then(ok => showToast(ok ? 'Журнал скопирован' : 'Не удалось скопировать'))}>Скопировать журнал</button>
      <button className="btn md secondary" onClick={close}>Закрыть</button>
    </div>
  </div></div>
}
