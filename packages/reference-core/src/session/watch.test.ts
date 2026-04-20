import { afterEach, describe, expect, it, vi } from 'vitest'

type ParcelEvent = { path: string }
type ParcelCallback = (error: Error | null, events: ParcelEvent[]) => void

async function importWatchModule() {
  vi.resetModules()

  const subscribe = vi.fn()
  const unsubscribe = vi.fn()
  const existsSync = vi.fn(() => true)

  vi.doMock('@parcel/watcher', () => ({
    subscribe,
  }))
  vi.doMock('node:fs', () => ({
    existsSync,
  }))

  const mod = await import('./watch')
  return { ...mod, subscribe, unsubscribe, existsSync }
}

afterEach(() => {
  vi.useRealTimers()
  vi.resetModules()
  vi.doUnmock('@parcel/watcher')
  vi.doUnmock('node:fs')
  vi.restoreAllMocks()
})

describe('createSessionWatcher', () => {
  it('coalesces rapid outDir events into one reconcile', async () => {
    vi.useFakeTimers()

    const { createSessionWatcher, subscribe, unsubscribe } = await importWatchModule()
    let callback: ParcelCallback | null = null

    subscribe.mockImplementation(async (_path: string, cb: ParcelCallback) => {
      callback = cb
      return { unsubscribe }
    })

    const changes: number[] = []
    const watcher = createSessionWatcher('/repo/.reference-ui', () => {
      changes.push(Date.now())
    })

    watcher.restart()
    await Promise.resolve()

    expect(changes).toHaveLength(2)

    if (!callback) {
      throw new Error('expected watcher callback to be registered')
    }

    const watcherCallback: ParcelCallback = callback

    watcherCallback(null, [{ path: '/repo/.reference-ui/session.json.tmp' }])
    watcherCallback(null, [{ path: '/repo/.reference-ui/session.json' }])

    expect(changes).toHaveLength(2)

    await vi.advanceTimersByTimeAsync(10)

    expect(changes).toHaveLength(3)

    watcher.dispose()
  })

  it('cancels a pending reconcile when disposed', async () => {
    vi.useFakeTimers()

    const { createSessionWatcher, subscribe, unsubscribe } = await importWatchModule()
    let callback: ParcelCallback | null = null

    subscribe.mockImplementation(async (_path: string, cb: ParcelCallback) => {
      callback = cb
      return { unsubscribe }
    })

    const onSessionChange = vi.fn()
    const watcher = createSessionWatcher('/repo/.reference-ui', onSessionChange)

    watcher.restart()
    await Promise.resolve()
    onSessionChange.mockClear()

    if (!callback) {
      throw new Error('expected watcher callback to be registered')
    }

    const watcherCallback: ParcelCallback = callback

    watcherCallback(null, [{ path: '/repo/.reference-ui/session.json.tmp' }])
    watcher.dispose()

    await vi.advanceTimersByTimeAsync(10)

    expect(onSessionChange).not.toHaveBeenCalled()
  })
})