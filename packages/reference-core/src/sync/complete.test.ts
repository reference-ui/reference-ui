import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SyncPayload } from './types'

const onHandlers = new Map<string, Array<(payload?: unknown) => void>>()
const onceHandlers = new Map<string, Array<(payload?: unknown) => void>>()
const shutdownAndExit = vi.fn()
const logPackagesBuilt = vi.fn()
const logSyncDone = vi.fn()
const logSyncFailure = vi.fn()
const logSyncMilestone = vi.fn()
const logSyncReady = vi.fn()
const markSyncCycleStart = vi.fn()
const REF_SYNC_FAILED_MESSAGE = '[ref sync] failed\n'

function registerHandler(
  store: Map<string, Array<(payload?: unknown) => void>>,
  event: string,
  handler: (payload?: unknown) => void
): void {
  const handlers = store.get(event) ?? []
  handlers.push(handler)
  store.set(event, handlers)
}

function fireEvent(event: string, payload?: unknown): void {
  for (const handler of onHandlers.get(event) ?? []) {
    handler(payload)
  }

  const handlers = onceHandlers.get(event) ?? []
  onceHandlers.delete(event)
  for (const handler of handlers) {
    handler(payload)
  }
}

async function loadCompleteModule() {
  vi.resetModules()
  onHandlers.clear()
  onceHandlers.clear()
  shutdownAndExit.mockReset()
  logPackagesBuilt.mockReset()
  logSyncDone.mockReset()
  logSyncFailure.mockReset()
  logSyncMilestone.mockReset()
  logSyncReady.mockReset()
  markSyncCycleStart.mockReset()

  vi.doMock('../lib/event-bus', () => ({
    on: (event: string, handler: (payload?: unknown) => void) =>
      registerHandler(onHandlers, event, handler),
    once: (event: string, handler: (payload?: unknown) => void) =>
      registerHandler(onceHandlers, event, handler),
  }))

  vi.doMock('../packager/logging', () => ({
    logPackagesBuilt,
  }))

  vi.doMock('./logging', () => ({
    REF_SYNC_FAILED_MESSAGE,
    logSyncDone,
    logSyncFailure,
    logSyncMilestone,
    logSyncReady,
    markSyncCycleStart,
  }))

  vi.doMock('./shutdown', () => ({
    shutdownAndExit,
  }))

  return import('./complete')
}

function createPayload(watch: boolean): SyncPayload {
  return {
    cwd: '/tmp/workspace',
    config: {} as SyncPayload['config'],
    options: { watch },
  }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../lib/event-bus')
  vi.doUnmock('../packager/logging')
  vi.doUnmock('./logging')
  vi.doUnmock('./shutdown')
  vi.restoreAllMocks()
})

describe('sync/complete', () => {
  it('shuts down after final library declarations in one-shot mode', async () => {
    const { initComplete } = await loadCompleteModule()
    initComplete(createPayload(false))

    fireEvent('virtual:complete')
    fireEvent('system:config:complete')
    fireEvent('system:panda:codegen')

    expect(logSyncMilestone).toHaveBeenNthCalledWith(1, 'Prepared virtual workspace')
    expect(logSyncMilestone).toHaveBeenNthCalledWith(2, 'Generated system config')
    expect(logSyncMilestone).toHaveBeenNthCalledWith(3, 'Generated Panda output')

    fireEvent('packager:complete', { packageCount: 1, durationMs: 20 })
    expect(logPackagesBuilt).toHaveBeenCalledWith(1, 20)
    expect(shutdownAndExit).not.toHaveBeenCalled()

    fireEvent('packager-ts:complete')
    expect(logSyncMilestone).toHaveBeenCalledWith(
      'Generated library TypeScript declarations'
    )
    expect(logSyncDone).toHaveBeenCalled()
    expect(shutdownAndExit).toHaveBeenCalledWith(0, 'sync:complete')
  })

  it('logs package completion before ready in watch mode', async () => {
    const { initComplete } = await loadCompleteModule()
    initComplete(createPayload(true))

    fireEvent('system:panda:css')
    fireEvent('packager:runtime:complete', { packageCount: 3, durationMs: 20 })

    expect(logPackagesBuilt).toHaveBeenCalledWith(3, 20)
    expect(logPackagesBuilt.mock.invocationCallOrder[0]).toBeLessThan(
      logSyncReady.mock.invocationCallOrder[0]
    )
    expect(shutdownAndExit).not.toHaveBeenCalled()
  })

  it('marks watch rebuilds ready only after css and runtime packaging complete', async () => {
    const { initComplete } = await loadCompleteModule()
    initComplete(createPayload(true))

    fireEvent('watch:change')
    fireEvent('system:panda:css')
    expect(logSyncReady).not.toHaveBeenCalled()

    fireEvent('packager:runtime:complete', { packageCount: 3, durationMs: 12 })

    expect(logSyncReady).toHaveBeenCalledTimes(1)
    expect(markSyncCycleStart).toHaveBeenCalledTimes(1)
  })

  it('prints a watch failure marker instead of exiting on MCP failure', async () => {
    const { initComplete, REF_SYNC_FAILED_MESSAGE } = await loadCompleteModule()
    initComplete(createPayload(true))

    fireEvent('mcp:failed')

    expect(logSyncFailure).toHaveBeenCalled()
    expect(REF_SYNC_FAILED_MESSAGE).toBe('[ref sync] failed\n')
    expect(shutdownAndExit).not.toHaveBeenCalled()
  })
})
