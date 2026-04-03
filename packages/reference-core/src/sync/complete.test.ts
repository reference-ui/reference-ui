import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SyncPayload } from './types'

const onHandlers = new Map<string, Array<() => void>>()
const onceHandlers = new Map<string, Array<() => void>>()
const shutdownAndExit = vi.fn()

function registerHandler(
  store: Map<string, Array<() => void>>,
  event: string,
  handler: () => void
): void {
  const handlers = store.get(event) ?? []
  handlers.push(handler)
  store.set(event, handlers)
}

function fireEvent(event: string): void {
  for (const handler of onHandlers.get(event) ?? []) {
    handler()
  }

  const handlers = onceHandlers.get(event) ?? []
  onceHandlers.delete(event)
  for (const handler of handlers) {
    handler()
  }
}

async function loadCompleteModule() {
  vi.resetModules()
  onHandlers.clear()
  onceHandlers.clear()
  shutdownAndExit.mockReset()

  vi.doMock('../lib/event-bus', () => ({
    on: (event: string, handler: () => void) =>
      registerHandler(onHandlers, event, handler),
    once: (event: string, handler: () => void) =>
      registerHandler(onceHandlers, event, handler),
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
  vi.doUnmock('./shutdown')
  vi.restoreAllMocks()
})

describe('sync/complete', () => {
  it('waits for MCP completion before shutting down in one-shot mode', async () => {
    const { initComplete } = await loadCompleteModule()
    initComplete(createPayload(false))

    fireEvent('packager:complete')
    expect(shutdownAndExit).not.toHaveBeenCalled()

    fireEvent('mcp:complete')
    expect(shutdownAndExit).toHaveBeenCalledWith(0, 'sync:complete')
  })

  it('writes ready as soon as packager completes in watch mode', async () => {
    const stdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const { initComplete, REF_SYNC_READY_MESSAGE } = await loadCompleteModule()
    initComplete(createPayload(true))

    fireEvent('packager:complete')

    expect(stdoutWrite).toHaveBeenCalledWith(REF_SYNC_READY_MESSAGE)
    expect(shutdownAndExit).not.toHaveBeenCalled()
  })

  it('prints a watch failure marker instead of exiting on MCP failure', async () => {
    const stderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    const { initComplete, REF_SYNC_FAILED_MESSAGE } = await loadCompleteModule()
    initComplete(createPayload(true))

    fireEvent('mcp:failed')

    expect(stderrWrite).toHaveBeenCalledWith(REF_SYNC_FAILED_MESSAGE)
    expect(shutdownAndExit).not.toHaveBeenCalled()
  })
})
