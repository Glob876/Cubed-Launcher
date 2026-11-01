import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { CatalogFor } from '../components/catalog/CatalogTop'
import { useProfiles } from '../state/profiles'
import { openModal } from '../state/ui'
import { Icon } from '../components/Icon'
import { CatalogSkeleton } from '../components/catalog/CatalogRow'
import '../styles/pixel/catalog2.css'
import { ModRow } from '../components/ModRow'
import { useMods, mrToHit, type ModHit } from '../state/mods'
export function CubedCatalog() {
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('modpack')
  const profiles = useProfiles(s => s.profiles)
  const selected = useProfiles(s => s.selected)
  const [scope, setScope] = useState(false)
  const [sort, setSort] = useState('downloads')
  const build = profiles.find(p => p.name === selected) || profiles[0] || null
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
      void invoke<{ hits: unknown[]; total_hits: number }>('cubed_modrinth_search', { query, kind, offset, gameVersion: scope ? build?.version : null, loader: scope ? build?.loader : null, sort })
        .then(r => { if (!cancelled) { setHits(r.hits.map(mrToHit)); setTotal(r.total_hits) } })
        .catch(e => { if (!cancelled) setError(String(e)) })
        .finally(() => { if (!cancelled) setBusy(false) })
    }, 250)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [query, kind, offset,scope,build?.name,sort])
  const kinds=[['modpack','Сборки'],['mod','Моды'],['resourcepack','Ресурспаки'],['shader','Шейдеры'],['datapack','Датапаки']]
  return <div className="mr-cat" data-section={kind}>
    <nav className="segs mr-types" aria-label="Разделы каталога">{kinds.map(([id,label]) => <button key={id} className={'seg mr-type'+(kind === id?' on':'')} onClick={() => {setKind(id);setOffset(0)}}>{label}</button>)}</nav>
    <div className="mr-cat-body"><div className="mr-layout">
      <aside className="mr-aside" aria-label="Фильтры"><CatalogFor build={build} builds={profiles} scoped={scope} fitCount={scope ? total : null} allCount={scope ? null : total} onSelect={name => {useProfiles.getState().setSelected(name);setOffset(0)}} onScope={v => {setScope(v);setOffset(0)}} onNew={() => openModal('nbModal')} />
        <div className="card mr-group"><div className="mr-group-head">Источник</div><div className="mr-opts"><span className="mr-opt is-on"><span className="mr-check is-on" />Modrinth</span></div></div>
      </aside>
      <div className="mr-main"><div className="mr-toolbar mr-toolbar-one">
        <form role="search" className="input mr-search" onSubmit={e => e.preventDefault()}><Icon id="i-search" /><input type="search" aria-label="Поиск Modrinth" placeholder="Поиск" value={query} onChange={e => {setQuery(e.target.value);setOffset(0)}} /></form>
        <div className="mr-toolbar-row"><span className="mr-count" /><div className="segs mr-sort" role="group" aria-label="Сортировка"><button className={'seg'+(sort === 'downloads'?' on':'')} onClick={() => {setSort('downloads');setOffset(0)}}>Популярные</button><button className={'seg'+(sort === 'newest'?' on':'')} onClick={() => {setSort('newest');setOffset(0)}}>Новые</button></div></div>
      </div><div className={'mr-loadbar'+(busy?' on':'')} /><h1 className="mr-h1 mr-h1-sm">{kinds.find(([id]) => id === kind)?.[1]}<span className="mr-h1-n">{total}</span></h1>
      <div className="mr-list">{busy ? <CatalogSkeleton /> : error ? <div className="cat-offline" role="alert">{error}</div> : hits.length ? hits.map(h => <ModRow key={h.pid} h={h} />) : <p>Ничего не найдено</p>}</div>
      <div className="mr-more"><button className="btn md secondary" disabled={busy || !offset} onClick={() => setOffset(v => Math.max(0,v-20))}>Назад</button><button className="btn md secondary" disabled={busy || offset+20>=total} onClick={() => setOffset(v=>v+20)}>Далее</button></div>
      </div>
    </div></div>
  </div>
}
