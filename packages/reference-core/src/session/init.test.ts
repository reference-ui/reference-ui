import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { SyncPayload } from '../sync/types'

const onHandlers = new Map<string, Array<(payload?: unknown) => void>>()
const mockInitSessionState = vi.fn()
const mockTransitionSession = vi.fn()
const mockTransitionBuild = vi.fn()
const mockCleanupSession = vi.fn()
const mockTryAcquireLock = vi.fn()

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
  mockTryAcquireLock.mockReset()

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
    tryAcquireLock: mockTryAcquireLock,
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

describe('session/init – lock guard (watch mode only)', () => {
  it('passes when tryAcquireLock returns acquired', async () => {
    dir = mkdtempSync(join(tmpdir(), 'ref-init-test-'))
    const { initSession } = await loadInitModule(dir)
    mockTryAcquireLock.mockReturnValue('acquired')

    expect(() => initSession(createPayload(true))).not.toThrow()
    expect(mockInitSessionState).toHaveBeenCalledWith(dir, 'watch')
  })

  it('retries once and succeeds when first attempt returns stale', async () => {
    dir = mkdtempSync(join(tmpdir(), 'ref-init-test-'))
    const { initSession } = await loadInitModule(dir)
    mockTryAcquireLock.mockReturnValueOnce('stale').mockReturnValueOnce('acquired')

    expect(() => initSession(createPayload(true))).not.toThrow()
    expect(mockTryAcquireLock).toHaveBeenCalledTimes(2)
  })

  it('exits when tryAcquireLock returns contested', async () => {
    dir = mkdtempSync(join(tmpdir(), 'ref-init-test-'))
    const { initSession } = await loadInitModule(dir)
    mockTryAcquireLock.mockReturnValue('contested')

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never)

    initSession(createPayload(true))

    expect(exitSpy).toHaveBeenCalledWith(1)
    exitSpy.mockRestore()
  })

  it('does not call tryAcquireLock in one-shot mode', async () => {
    dir = mkdtempSync(join(tmpdir(), 'ref-init-test-'))
    const { initSession } = await loadInitModule(dir)

    expect(() => initSession(createPayload(false))).not.toThrow()
    expect(mockTryAcquireLock).not.toHaveBeenCalled()
  })
})

describe('session/init – one-shot mode event wiring', () => {
  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), 'ref-init-test-'))
  })

  it('transitions to running on virtual:complete', async () => {
    const { initSession } = await loadInitModule(dir)
    mockTryAcquireLock.mockReturnValue('acquired')
    initSession(createPayload(false))

    fireOn('virtual:complete')

    expect(mockTransitionSession).toHaveBeenCalledWith('starting')
    expect(mockTransitionBuild).toHaveBeenCalledWith('running')
  })

  it('transitions build to ready on packager:complete', async () => {
    const { initSession } = await loadInitModule(dir)
    mockTryAcquireLock.mockReturnValue('acquired')
    initSession(createPayload(false))

    fireOn('packager:complete')

    expect(mockTransitionBuild).toHaveBeenCalledWith('ready')
  })

  it('marks build and session as failed on sync:failed', async () => {
    const { initSession } = await loadInitModule(dir)
    mockTryAcquireLock.mockReturnValue('acquired')
    initSession(createPayload(false))

    fireOn('sync:failed')

    expect(mockTransitionBuild).toHaveBeenCalledWith('failed')
    expect(mockTransitionSession).toHaveBeenCalledWith('failed')
  })

  it('cleans up session on sync:complete in one-shot mode', async () => {
    const { initSession } = await loadInitModule(dir)
    mockTryAcquireLock.mockReturnValue('acquired')
    initSession(createPayload(false))

    fireOn('sync:complete')

    expect(mockCleanupSession).toHaveBeenCalled()
  })
})

describe('session/init – watch mode event wiring', () => {
  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), 'ref-init-test-'))
  })

  it('transitions to watching on virtual:complete in watch mode', async () => {
    const { initSession } = await loadInitModule(dir)
    mockTryAcquireLock.mockReturnValue('acquired')
    initSession(createPayload(true))

    fireOn('virtual:complete')

    expect(mockTransitionSession).toHaveBeenCalledWith('watching')
  })

  it('queues build on watch:change', async () => {
    const { initSession } = await loadInitModule(dir)
    mockTryAcquireLock.mockReturnValue('acquired')
    initSession(createPayload(true))

    fireOn('watch:change')

    expect(mockTransitionBuild).toHaveBeenCalledWith('queued')
  })

  it('resumes running on run:virtual:sync:file', async () => {
    const { initSession } = await loadInitModule(dir)
    mockTryAcquireLock.mockReturnValue('acquired')
    initSession(createPayload(true))

    fireOn('run:virtual:sync:file')

    expect(mockTransitionBuild).toHaveBeenCalledWith('running')
  })

  it('marks watch builds ready after Panda CSS and runtime packaging finish', async () => {
    const { initSession } = await loadInitModule(dir)
    mockTryAcquireLock.mockReturnValue('acquired')
    initSession(createPayload(true))

    fireOn('system:panda:css')
    expect(mockTransitionBuild).not.toHaveBeenCalledWith('ready')

    fireOn('packager:runtime:complete')

    expect(mockTransitionBuild).toHaveBeenCalledWith('ready')
  })

  it('marks watch rebuilds ready only after both watch outputs finish', async () => {
    const { initSession } = await loadInitModule(dir)
    mockTryAcquireLock.mockReturnValue('acquired')
    initSession(createPayload(true))

    fireOn('watch:change')
    fireOn('system:panda:css')
    expect(mockTransitionBuild).not.toHaveBeenCalledWith('ready')

    fireOn('packager:runtime:complete')

    expect(mockTransitionBuild).toHaveBeenCalledWith('queued')
    expect(mockTransitionBuild).toHaveBeenCalledWith('ready')
  })

  it('does not call cleanupSession on sync:complete in watch mode', async () => {
    const { initSession } = await loadInitModule(dir)
    mockTryAcquireLock.mockReturnValue('acquired')
    initSession(createPayload(true))

    fireOn('sync:complete')

    expect(mockCleanupSession).not.toHaveBeenCalled()
  })
})
