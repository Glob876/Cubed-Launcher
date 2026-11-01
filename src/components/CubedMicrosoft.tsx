import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useAccounts } from '../state/accounts'
import { startMsLogin, cancelMsLogin, copyMsCode, openMsVerifyPage, useMsLogin } from '../state/msLogin'
import { showToast } from '../state/ui'
export function MicrosoftAccount() {
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

export function MicrosoftSetup() {
  const [clientId, setClientId] = useState('')
  useEffect(() => { void invoke<string>('cubed_microsoft_client_id').then(setClientId).catch(e => showToast(String(e), 'error')) }, [])
  return <section className="cubed-panel"><h2>Настройка входа Microsoft</h2>
    <p>Для Cubed Launcher требуется собственная регистрация приложения Microsoft. Client ID — публичный идентификатор приложения, не пароль аккаунта.</p>
    <label>Client ID приложения<input value={clientId} onChange={e => setClientId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></label>
    <button className="btn md primary" onClick={() => void invoke('cubed_set_microsoft_client_id', { clientId }).then(() => showToast('Сохранено')).catch(e => showToast(String(e), 'error'))}>Сохранить</button>
    <p>Версию Java, память и параметры запуска можно менять в настройках каждой сборки.</p>
    <p>Cubed Launcher — форк Millida Launcher. GPL-3.0-only.</p>
  </section>
}
