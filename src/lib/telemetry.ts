// Cubed Launcher: telemetry is permanently removed. Compatibility functions
// let existing callers keep local error handling without collecting any data.
import { classifyError, type ErrorKind } from './errorKind'
import { hasTauri } from '../ipc/tauri'
import { setGameTelemetry } from '../ipc/commands'

export type TelemetryEventType =
  | 'app_start'
  | 'app_exit'
  | 'game_launch'
  | 'game_exit'
  | 'game_crash'
  | 'build_create'
  | 'build_import'
  | 'build_delete'
  | 'content_install'
  | 'content_update'
  | 'modpack_install'
  | 'screen_view'
  | 'server_join'
  | 'skin_apply'
  | 'skin_diag'
  | 'account_link'
  | 'hosting_open'
  | 'pvp_client_open'
  | 'hosting_action'
  | 'rating_open'
  | 'store_open'
  | 'pack_buy_click'
  | 'ui_click'
  | 'impression'
  | 'catalog_search'
  | 'catalog_install'
  | 'mode_open'
  | 'purchase_start'
  | 'purchase_result'
  | 'feedback_send'
  | 'update_applied'
  | 'error'
  | 'perf'
  | 'lag_detected'
  | 'lag_fixed'

export type LiveBeatPayload = {
  installId: string
  status: 'idle' | 'playing'
  os?: string
  appVersion?: string
  locale?: string
  timezone?: string
  build?: string
  mc?: string
  server?: string
}


export function telemetryEnabled(): boolean { return false }
export function setTelemetryEnabled(_on: boolean): void {}
export function installId(): string { return '' }
export function setInventory(_builds: number, _mods: number): void {}
export async function flushTelemetry(): Promise<void> {}
export async function liveBeatPayload(_status: 'idle' | 'playing', _meta?: { build?: string | null; mc?: string | null; server?: string | null }, _force = false): Promise<LiveBeatPayload | null> { return null }
export async function realtimeClientInfo(): Promise<{ installId: string | null; version: string; os: string }> { return { installId: null, version: '', os: '' } }
export async function liveBeat(_status: 'idle' | 'playing', _meta?: { build?: string | null; mc?: string | null; server?: string | null }, _force = false): Promise<void> {}
export function track(_type: TelemetryEventType, _data?: Record<string, string | number | boolean>, _extra?: { durationMs?: number; ok?: boolean }): void {}
export function trackAppExit(_opts?: { maybeCancelled?: boolean; flush?: boolean }): void {}
export function cancelAppExit(): void {}
export function trackTimed(_type: TelemetryEventType, _startedAt: number, _data?: Record<string, string | number | boolean>, _ok = true): void {}
export function trackFailure(_where: string, err: unknown, _extra?: Record<string, string | number | boolean | null | undefined>): ErrorKind | null {
  const text = err instanceof Error ? err.message : String(err)
  const kind = classifyError(text)
  return kind === 'cancelled' || /unauthorized|http 401|не авторизован/i.test(text) ? null : kind
}
export function __resetTelemetryForTests(): void {}
export async function initTelemetry(_bootMs: number): Promise<void> {
  for (const key of ['m-install-id', 'm-telemetry-queue']) localStorage.removeItem(key)
  localStorage.setItem('m-telemetry-off', '1')
  if (hasTauri()) await setGameTelemetry(false).catch(() => {})
}
