import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { join, tmpdir } from 'node:path'
import type { SyncPayload } from '../sync/types'

const onHandlers = new Map<string, Array<(payload?: unknown) => void>>()
const mockInitSessionState = vi.fn()
const mockTransitionSession = vi.fn()
const mockTransitionBuild = vi.fn()
const mockCleanupSession = vi.fn()
const mockReadLock = vi.fn()
const mockIsLockStale = vi.fn()

function fireOn(event: string, payload?: unknown): void {
  for (const handler of onHandlers.get(event) ?? []) {
    handler(payload)
  }
}

async function loadInitModule(outDir: string) {
  vi.resetModules()
  onHandlers.clear()
  mockInitSessionState.mockReset()
  mockTransitionSession.mockReset()
  mockTransitionBuild.mockReset()
  mockCleanupSession.mockReset()
  mockReadLock.mockReset()
  mockIsLockStale.mockReset()

  vi.doMock('../lib/event-bus', () => ({
    on: (event: string, handler: (payload?: unknown) => void) => {
      const existing = onHandlers.get(event) ?? []
      existing.push(handler)
      onHandlers.set(event, existing)
    },
  }))

  vi.doMock('../lib/paths', () => ({
    getOutDirPath: () => outDir,
  }))

  vi.doMock('./state', () => ({
    initSessionState: mockInitSessionState,
    transitionSession: mockTransitionSession,
    transitionBuild: mockTransitionBuild,
    cleanupSession: mockCleanupSession,
  }))

  vi.doMock('./files', () => ({
    readLock: mockReadLock,
    isLockStale: mockIsLockStale,
  }))

  vi.doMock('../lib/log', () => ({
    log: { debug: vi.fn(), error: vi.fn() },
  }))

  return import('./init')
}

function createPayload(watch: boolean): SyncPayload {
  return {
    cwd: '/project',
    config: {} as SyncPayload['config'],
    options: { watch },
  }
}

let dir: string

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../lib/event-bus')
  vi.doUnmock('../lib/paths')
  vi.doUnmock('./state')
  vi.doUnmock('./files')
  vi.doUnmock('../lib/log')
  vi.restoreAllMocks()
  if (dir) rmSync(dir, { recursive: true, force: true })
})

describe('session/init – lock guard', () => {
  it('passes when no lock exists', async () => {
    dir = mkdtempSync(join(tmpdir(), 'ref-init-test-'))
    mockReadLock.mockReturnValue(null)

    const { initSession } = await loadInitModule(dir)
    expect(() => initSession(createPayload(false))).not.toThrow()
    expect(mockInitSessionState).toHaveBeenCalledWith(dir, 'one-shot')
  })

  it('reclaims a stale lock without exiting', async () => {
    dir = mkdtempSync(join(tmpdir(), 'ref-init-test-'))
    mockReadLock.mockReturnValue({ pid: 9999, startedAt: '2026-01-01T00:00:00.000Z' })
    mockIsLockStale.mockReturnValue(true)

    const { initSession } = await loadInitModule(dir)
    expect(() => initSession(createPayload(false))).not.toThrow()
    expect(mockInitSessionState).toHaveBeenCalled()
  })

  it('exits when a live lock exists', async () => {
    dir = mkdtempSync(join(tmpdir(), 'ref-init-test-'))
    mockReadLock.mockReturnValue({ pid: process.pid, startedAt: '2026-01-01T00:00:00.000Z' })
    mockIsLockStale.mockReturnValue(false)

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never)

    const { initSession } = await loadInitModule(dir)
    initSession(createPayload(false))

    expect(exitSpy).toHaveBeenCalledWith(1)
    exitSpy.mockRestore()
  })
})

describe('session/init – one-shot mode event wiring', () => {
  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), 'ref-init-test-'))
    mockReadLock.mockReturnValue(null)
  })

  it('transitions to running on virtual:complete', async () => {
    const { initSession } = await loadInitModule(dir)
    initSession(createPayload(false))

    fireOn('virtual:complete')

    expect(mockTransitionSession).toHaveBeenCalledWith('starting')
    expect(mockTransitionBuild).toHaveBeenCalledWith('running')
  })

  it('transitions build to ready on packager:complete', async () => {
    const { initSession } = await loadInitModule(dir)
    initSession(createPayload(false))

    fireOn('packager:complete')

    expect(mockTransitionBuild).toHaveBeenCalledWith('ready')
  })

  it('marks build and session as failed on sync:failed', async () => {
    const { initSession } = await loadInitModule(dir)
    initSession(createPayload(false))

    fireOn('sync:failed')

    expect(mockTransitionBuild).toHaveBeenCalledWith('failed')
    expect(mockTransitionSession).toHaveBeenCalledWith('failed')
  })

  it('cleans up session on sync:complete in one-shot mode', async () => {
    const { initSession } = await loadInitModule(dir)
    initSession(createPayload(false))

    fireOn('sync:complete')

    expect(mockCleanupSession).toHaveBeenCalled()
  })
})

describe('session/init – watch mode event wiring', () => {
  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), 'ref-init-test-'))
    mockReadLock.mockReturnValue(null)
  })

  it('transitions to watching on virtual:complete in watch mode', async () => {
    const { initSession } = await loadInitModule(dir)
    initSession(createPayload(true))

    fireOn('virtual:complete')

    expect(mockTransitionSession).toHaveBeenCalledWith('watching')
  })

  it('queues build on watch:change', async () => {
    const { initSession } = await loadInitModule(dir)
    initSession(createPayload(true))

    fireOn('watch:change')

    expect(mockTransitionBuild).toHaveBeenCalledWith('queued')
  })

  it('resumes running on run:virtual:sync:file', async () => {
    const { initSession } = await loadInitModule(dir)
    initSession(createPayload(true))

    fireOn('run:virtual:sync:file')

    expect(mockTransitionBuild).toHaveBeenCalledWith('running')
  })

  it('does not call cleanupSession on sync:complete in watch mode', async () => {
    const { initSession } = await loadInitModule(dir)
    initSession(createPayload(true))

    fireOn('sync:complete')

    expect(mockCleanupSession).not.toHaveBeenCalled()
  })
})
