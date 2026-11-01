import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { ModRow } from '../components/ModRow'
import { useMods, mrToHit, type ModHit } from '../state/mods'
export function CubedCatalog() {
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('modpack')
  const [offset, setOffset] = useState(0)
  const [hits, setHits] = useState<ModHit[]>([])
  const [total, setTotal] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let cancelled = false
    setBusy(true); setError(''); setHits([])
    useMods.setState({ modTab: kind })
    const timer = setTimeout(() => {
      void invoke<{ hits: unknown[]; total_hits: number }>('cubed_modrinth_search', { query, kind, offset })
        .then(r => { if (!cancelled) { setHits(r.hits.map(mrToHit)); setTotal(r.total_hits) } })
        .catch(e => { if (!cancelled) setError(String(e)) })
        .finally(() => { if (!cancelled) setBusy(false) })
    }, 250)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [query, kind, offset])
  return <section className="cubed-panel"><h1>Modrinth</h1>
    <div className="cubed-row"><input aria-label="Поиск Modrinth" placeholder="Название сборки или мода" value={query} onChange={e => { setQuery(e.target.value); setOffset(0) }} />
      <select aria-label="Тип контента" value={kind} onChange={e => { setKind(e.target.value); setOffset(0) }}>
        <option value="modpack">Сборки</option><option value="mod">Моды</option><option value="resourcepack">Ресурспаки</option><option value="shader">Шейдеры</option><option value="datapack">Датапаки</option>
      </select></div>
    {busy ? <p role="status">Загрузка…</p> : error ? <p role="alert">{error}</p> : hits.length ? hits.map(h => <ModRow key={h.pid} h={h} />) : <p>Ничего не найдено</p>}
    <div className="cubed-row"><button className="btn md secondary" disabled={busy || !offset} onClick={() => setOffset(v => Math.max(0, v - 20))}>Назад</button><span>{total ? `${offset + 1}–${Math.min(offset + 20, total)} из ${total}` : '0'}</span><button className="btn md secondary" disabled={busy || offset + 20 >= total} onClick={() => setOffset(v => v + 20)}>Далее</button></div>
  </section>
}

