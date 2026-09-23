import { afterEach, describe, expect, it, vi } from 'vitest'

const emit = vi.fn()
const logError = vi.fn()
const shutdownAndExit = vi.fn()

async function loadFailureBoundaryModule() {
  vi.resetModules()
  emit.mockReset()
  logError.mockReset()
  shutdownAndExit.mockReset()

  vi.doMock('../lib/event-bus', () => ({
    emit,
  }))

  vi.doMock('../lib/log', () => ({
    log: {
      error: logError,
    },
  }))

  vi.doMock('./shutdown', () => ({
    shutdownAndExit,
  }))

  return import('./failure-boundary')
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../lib/event-bus')
  vi.doUnmock('../lib/log')
  vi.doUnmock('./shutdown')
  vi.restoreAllMocks()
})

describe('sync/failure-boundary', () => {
  it('routes uncaught exceptions into sync shutdown', async () => {
    const { createUnexpectedSyncFailureHandler } = await loadFailureBoundaryModule()

    createUnexpectedSyncFailureHandler('uncaughtException')(new Error('boom'))

    expect(logError).toHaveBeenCalledWith('[sync] Unhandled uncaughtException', expect.any(Error))
    expect(emit).toHaveBeenCalledWith('sync:failed', {})
    expect(shutdownAndExit).toHaveBeenCalledWith(1, 'uncaughtException')
  })

  it('routes unhandled rejections into sync shutdown', async () => {
    const { createUnexpectedSyncFailureHandler } = await loadFailureBoundaryModule()

    createUnexpectedSyncFailureHandler('unhandledRejection')('boom')

    expect(logError).toHaveBeenCalledWith('[sync] Unhandled unhandledRejection', expect.any(Error))
    expect(emit).toHaveBeenCalledWith('sync:failed', {})
    expect(shutdownAndExit).toHaveBeenCalledWith(1, 'unhandledRejection')
  })
})