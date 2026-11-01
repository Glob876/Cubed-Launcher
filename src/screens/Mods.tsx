import { CubedCatalog } from './CubedCatalog'
export function Mods({ on }: { on: boolean }) { return on ? <CubedCatalog /> : null }
export function CatalogPane(_props: { content?: boolean; onOpenPack?: (slug: string) => boolean | void; servers?: import('react').ReactNode }) { return <CubedCatalog /> }
