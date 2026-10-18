// Unit tests for the watch run over a temp project, with the sync pipeline, the config
// read, and the parcel subscribe mocked; the session lock is the real one. They pin the
// boot order (subscribe before the baseline, so an edit made during the boot resyncs after
// it), a dropped-events resync, the widened scope after a failed sync, the one catch-up for
// a root a resync newly subscribes, a poke that lands during the boot, and the cleanup when
// the baseline fails.

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Event as ParcelEvent } from '@parcel/watcher'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadUserConfigWithDependencies, getLastLoadedUserConfig, type LoadedUserConfig } from '../../config/load.ts'
import { sync, type SyncResult } from '../../sync/index.ts'
import { getSyncLockDir, getWatchStatePath, parseWatchState, type WatchState } from '../../sync/session-owner.ts'
import { watchSync } from './index.ts'
import { canonicalPath } from './match.ts'

const mocks = vi.hoisted(() => ({
  subscriptions: [] as Array<{
    root: string
    onEvent: (error: Error | null, events: ParcelEvent[]) => void
    unsubscribe: ReturnType<typeof vi.fn>
  }>,
  loaded: undefined as unknown,
  latest: undefined as unknown,
}))

vi.mock('@parcel/watcher', () => ({
  subscribe: vi.fn(async (root: string, onEvent: (error: Error | null, events: ParcelEvent[]) => void) => {
    const fake = { root, onEvent, unsubscribe: vi.fn(async () => {}) }
    mocks.subscriptions.push(fake)
    return fake
  }),
}))

vi.mock('../../sync/index.ts', () => ({ sync: vi.fn() }))

vi.mock('../../config/load.ts', () => ({
  loadUserConfigWithDependencies: vi.fn(async () => mocks.loaded),
  getLastLoadedUserConfig: vi.fn(() => mocks.latest),
  getAttemptedUserConfigDependencies: vi.fn(() => []),
}))

const DROPPED = 'Events were dropped by the FSEvents client. File system must be re-scanned.'
const tempDirs: string[] = []
const handles: Array<{ stop(): Promise<void> }> = []

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// The watch-state file as a one-shot would read it; null while the file is absent or torn.
function readWatchState(dir: string): WatchState | null {
  try {
    return parseWatchState(JSON.parse(readFileSync(getWatchStatePath(getSyncLockDir(dir)), 'utf8')) as unknown)
  } catch {
    return null
  }
}

function resultOf(): SyncResult {
  return { outDir: '', spec: {}, warningCount: 0, diagnostics: [], compilerDiagnostics: [] } as unknown as SyncResult
}

function loadedOf(include: string[]): LoadedUserConfig {
  return { config: { name: 'watch-run', include }, dependencyPaths: [] } as unknown as LoadedUserConfig
}

function makeProject(): string {
  const dir = canonicalPath(mkdtempSync(join(tmpdir(), 'core-watch-run-')))
  tempDirs.push(dir)
  mkdirSync(join(dir, 'theme'), { recursive: true })
  writeFileSync(join(dir, 'theme', 'a.ts'), 'a')
  return dir
}

// Starts the watch and keeps the handle, so afterEach releases the lock whatever the test did.
async function startWatch(dir: string, callbacks: Parameters<typeof watchSync>[1] = {}) {
  const handle = await watchSync(dir, callbacks)
  handles.push(handle)
  return handle
}

// Delivers one parcel batch to the subscription that owns the root (the first one by default).
function deliver(events: ParcelEvent[], index = 0): void {
  mocks.subscriptions[index]?.onEvent(null, events)
}

function deliverError(message: string, index = 0): void {
  mocks.subscriptions[index]?.onEvent(new Error(message), [])
}

beforeEach(() => {
  mocks.subscriptions.length = 0
  mocks.loaded = loadedOf(['theme/**/*.ts'])
  mocks.latest = mocks.loaded
  vi.mocked(sync).mockReset()
  vi.mocked(sync).mockResolvedValue(resultOf())
  vi.mocked(loadUserConfigWithDependencies).mockClear()
  vi.mocked(getLastLoadedUserConfig).mockClear()
})

afterEach(async () => {
  for (const handle of handles.splice(0)) await handle.stop()
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('watchSync boot', () => {
  it('subscribes before the baseline and resyncs an edit that lands while the baseline runs', async () => {
    const dir = makeProject()
    let subscribedBeforeBaseline = false
    vi.mocked(sync).mockImplementationOnce(async () => {
      subscribedBeforeBaseline = mocks.subscriptions.length > 0
      deliver([{ type: 'update', path: join(dir, 'theme', 'a.ts') }])
      return resultOf()
    })

    await startWatch(dir)

    expect(subscribedBeforeBaseline).toBe(true)
    await vi.waitFor(() => expect(sync).toHaveBeenCalledTimes(2), { timeout: 3000 })
  })

  it('runs one resync for a poke that lands during the baseline', async () => {
    const dir = makeProject()
    const onResync = vi.fn()
    vi.mocked(sync).mockImplementationOnce(async () => {
      process.emit('SIGUSR2')
      return resultOf()
    })

    await startWatch(dir, { onResync })

    await vi.waitFor(() => expect(onResync).toHaveBeenCalledTimes(1), { timeout: 3000 })
    expect(sync).toHaveBeenCalledTimes(2)
  })

  it('publishes the boot state once the poke listener is attached', async () => {
    const dir = makeProject()
    let listenersAtBaseline = 0
    let stateAtBaseline: WatchState | null = null
    vi.mocked(sync).mockImplementationOnce(async () => {
      listenersAtBaseline = process.listenerCount('SIGUSR2')
      stateAtBaseline = readWatchState(dir)
      return resultOf()
    })

    await startWatch(dir)

    expect(listenersAtBaseline).toBeGreaterThan(0)
    expect(stateAtBaseline).toMatchObject({ pid: process.pid, requested: 0, done: 0, failed: false, stopping: false })
  })

  it('releases the lock and every subscription when the baseline fails', async () => {
    const dir = makeProject()
    vi.mocked(sync).mockRejectedValueOnce(new Error('boot-boom'))

    await expect(watchSync(dir, {})).rejects.toThrow('boot-boom')

    expect(mocks.subscriptions).toHaveLength(1)
    expect(mocks.subscriptions[0]?.unsubscribe).toHaveBeenCalledTimes(1)
    expect(existsSync(getSyncLockDir(dir))).toBe(false)
  })
})

describe('watchSync resync', () => {
  it('resyncs after a dropped-events error and reports nothing', async () => {
    const dir = makeProject()
    const onError = vi.fn()
    await startWatch(dir, { onError })
    const before = vi.mocked(sync).mock.calls.length

    deliverError(DROPPED)

    await vi.waitFor(() => expect(sync).toHaveBeenCalledTimes(before + 1), { timeout: 3000 })
    expect(onError).not.toHaveBeenCalled()
  })

  it('widens the scope after a failed sync, so a fix in a newly included dir resyncs', async () => {
    const dir = makeProject()
    const onError = vi.fn()
    const onResync = vi.fn()
    await startWatch(dir, { onError, onResync })
    mocks.latest = loadedOf(['theme/**/*.ts', 'extra/**/*.ts'])
    // Every sync fails until the fix: the failing resync adds the extra root, and its one catch-up fails too.
    vi.mocked(sync).mockRejectedValue(new Error('extra-boom'))

    deliver([{ type: 'update', path: join(dir, 'theme', 'a.ts') }])
    await vi.waitFor(() => expect(onError).toHaveBeenCalled(), { timeout: 3000 })
    expect(onError.mock.calls[0]?.[0]).toMatchObject({ message: 'extra-boom' })
    await sleep(400)
    expect(onResync).not.toHaveBeenCalled()

    // The fix lands in the newly included dir: the watch must see it and resync.
    vi.mocked(sync).mockResolvedValue(resultOf())
    const syncsBefore = vi.mocked(sync).mock.calls.length
    deliver([{ type: 'update', path: join(dir, 'extra', 'tokens.ts') }])

    await vi.waitFor(() => expect(onResync).toHaveBeenCalledTimes(1), { timeout: 3000 })
    expect(sync).toHaveBeenCalledTimes(syncsBefore + 1)
  })

  it('runs one catch-up sync when a resync subscribes a root it did not have', async () => {
    const dir = makeProject()
    await startWatch(dir)
    mocks.latest = loadedOf(['theme/**/*.ts', 'extra/**/*.ts'])
    const before = vi.mocked(sync).mock.calls.length

    deliver([{ type: 'update', path: join(dir, 'theme', 'a.ts') }])

    await vi.waitFor(() => expect(sync).toHaveBeenCalledTimes(before + 2), { timeout: 3000 })
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(sync).toHaveBeenCalledTimes(before + 2)
    expect(mocks.subscriptions.map((sub) => sub.root)).toContain(join(dir, 'extra'))
  })
})

describe('watchSync handshake', () => {
  it('publishes a poke before its resync runs, then the result of that pass', async () => {
    const dir = makeProject()
    await startWatch(dir)
    let requestedInPass: number | undefined
    vi.mocked(sync).mockImplementationOnce(async () => {
      requestedInPass = readWatchState(dir)?.requested
      return resultOf()
    })

    process.emit('SIGUSR2')

    await vi.waitFor(() => expect(readWatchState(dir)).toMatchObject({ requested: 1, done: 1, failed: false }), {
      timeout: 3000,
    })
    expect(requestedInPass).toBe(1)
  })

  it('publishes a failed pass as failed, with done at the count it started from', async () => {
    const dir = makeProject()
    await startWatch(dir)
    vi.mocked(sync).mockRejectedValueOnce(new Error('pass-boom'))

    process.emit('SIGUSR2')

    await vi.waitFor(() => expect(readWatchState(dir)).toMatchObject({ requested: 1, done: 1, failed: true }), {
      timeout: 3000,
    })
  })

  it('publishes stopping before it unsubscribes', async () => {
    const dir = makeProject()
    const handle = await startWatch(dir)
    let stoppingAtUnsubscribe: boolean | undefined
    mocks.subscriptions[0]?.unsubscribe.mockImplementationOnce(async () => {
      stoppingAtUnsubscribe = readWatchState(dir)?.stopping
    })

    await handle.stop()

    expect(stoppingAtUnsubscribe).toBe(true)
  })
})
