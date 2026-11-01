import { expect, mock, test } from 'bun:test'

const store = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, value),
  removeItem: (key: string) => store.delete(key),
} })
const gameTelemetry: boolean[] = []
mock.module('../ipc/tauri', () => ({ hasTauri: () => true }))
mock.module('../ipc/commands', () => ({ setGameTelemetry: async (on: boolean) => { gameTelemetry.push(on) } }))
const T = await import('./telemetry')

test('statistics cannot be enabled and old identifiers and queued events are erased', async () => {
  store.set('m-install-id', 'previous-install')
  store.set('m-telemetry-queue', '[{"type":"app_start"}]')
  store.delete('m-telemetry-off')
  await T.initTelemetry(0)
  T.setTelemetryEnabled(true)
  expect(T.telemetryEnabled()).toBe(false)
  expect(T.installId()).toBe('')
  expect(store.has('m-install-id')).toBe(false)
  expect(store.has('m-telemetry-queue')).toBe(false)
  expect(gameTelemetry).toEqual([false])
})

test('events and heartbeats never reach the network or create a queue', async () => {
  const original = globalThis.fetch
  let requests = 0
  globalThis.fetch = (() => { requests++; throw new Error('network must not be used') }) as unknown as typeof fetch
  try {
    T.track('app_start')
    T.trackTimed('game_launch', 0)
    T.trackFailure('launch', new Error('failed'))
    T.trackAppExit()
    await T.flushTelemetry()
    await T.liveBeat('playing', { server: 'private.example' }, true)
    expect(await T.liveBeatPayload('idle')).toBeNull()
    expect((await T.realtimeClientInfo()).installId).toBeNull()
    expect(requests).toBe(0)
    expect(store.has('m-telemetry-queue')).toBe(false)
  } finally { globalThis.fetch = original }
})
