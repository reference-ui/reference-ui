import { afterEach, describe, expect, it, vi } from 'vitest'

const onHandlers = new Map<string, (payload?: unknown) => unknown>()

async function importWorkerModule() {
  vi.resetModules()
  onHandlers.clear()

  const emit = vi.fn()
  const copyAll = vi.fn(async () => {})
  const copyToVirtual = vi.fn(async () => '/workspace/app/.reference-ui/virtual/src/button.tsx')
  const removeFromVirtual = vi.fn(async () => {})
  const getVirtualPath = vi.fn(() => '/workspace/app/.reference-ui/virtual/src/button.jsx')
  const debug = vi.fn()
  const error = vi.fn()

  vi.doMock('../lib/event-bus', () => ({
    emit,
    on: (event: string, handler: (payload?: unknown) => unknown) => {
      onHandlers.set(event, handler)
    },
  }))
  vi.doMock('../lib/thread-pool', () => ({
    KEEP_ALIVE: 'keep-alive',
  }))
  vi.doMock('./copy', () => ({
    copyToVirtual,
    removeFromVirtual,
  }))
  vi.doMock('./copy-all', () => ({
    copyAll,
  }))
  vi.doMock('./utils', () => ({
    getVirtualPath,
  }))
  vi.doMock('../lib/log', () => ({
    log: { debug, error, info: vi.fn() },
  }))
  vi.doMock('../lib/paths', () => ({
    getVirtualDirPath: () => '/workspace/app/.reference-ui/virtual',
  }))

  const mod = await import('./worker')
  return {
    ...mod,
    emit,
    copyAll,
    copyToVirtual,
    removeFromVirtual,
    getVirtualPath,
    debug,
    error,
  }
}

afterEach(() => {
  vi.resetModules()
  onHandlers.clear()
  vi.doUnmock('../lib/event-bus')
  vi.doUnmock('../lib/thread-pool')
  vi.doUnmock('./copy')
  vi.doUnmock('./copy-all')
  vi.doUnmock('./utils')
  vi.doUnmock('../lib/log')
  vi.doUnmock('../lib/paths')
  vi.restoreAllMocks()
})

describe('virtual/worker', () => {
  it('registers handlers and emits virtual:ready on startup', async () => {
    const { default: runVirtual, emit } = await importWorkerModule()

    const result = await runVirtual({
      sourceDir: '/workspace/app',
      config: { include: ['src/**/*'], debug: false } as never,
    })

    expect(result).toBe('keep-alive')
    expect(onHandlers.has('run:virtual:copy:all')).toBe(true)
    expect(onHandlers.has('run:virtual:sync:file')).toBe(true)
    expect(emit).toHaveBeenCalledWith('virtual:ready')
  })

  it('copies changed files and emits virtual:fs:change', async () => {
    const { default: runVirtual, emit, copyToVirtual } = await importWorkerModule()

    await runVirtual({
      sourceDir: '/workspace/app',
      config: { include: ['src/**/*'], debug: true } as never,
    })
    emit.mockClear()

    await onHandlers.get('run:virtual:sync:file')?.({
      event: 'change',
      path: '/workspace/app/src/button.tsx',
    })

    expect(copyToVirtual).toHaveBeenCalledWith(
      '/workspace/app/src/button.tsx',
      '/workspace/app',
      '/workspace/app/.reference-ui/virtual',
      { debug: true }
    )
    expect(emit).toHaveBeenCalledWith('virtual:fs:change', {
      event: 'change',
      path: '/workspace/app/.reference-ui/virtual/src/button.tsx',
    })
  })

  it('removes deleted files and emits the source-shaped virtual path', async () => {
    const { default: runVirtual, emit, removeFromVirtual, getVirtualPath } = await importWorkerModule()

    await runVirtual({
      sourceDir: '/workspace/app',
      config: { include: ['src/**/*'], debug: false } as never,
    })
    emit.mockClear()

    await onHandlers.get('run:virtual:sync:file')?.({
      event: 'unlink',
      path: '/workspace/app/src/button.mdx',
    })

    expect(getVirtualPath).toHaveBeenCalledWith(
      '/workspace/app/src/button.mdx',
      '/workspace/app',
      '/workspace/app/.reference-ui/virtual'
    )
    expect(removeFromVirtual).toHaveBeenCalledWith(
      '/workspace/app/src/button.mdx',
      '/workspace/app',
      '/workspace/app/.reference-ui/virtual'
    )
    expect(emit).toHaveBeenCalledWith('virtual:fs:change', {
      event: 'unlink',
      path: '/workspace/app/.reference-ui/virtual/src/button.jsx',
    })
  })

  it('emits virtual:failed when the initial copy fails', async () => {
    const { default: runVirtual, emit, copyAll, error } = await importWorkerModule()
    copyAll.mockRejectedValue(new Error('copy exploded'))

    await runVirtual({
      sourceDir: '/workspace/app',
      config: { include: ['src/**/*'], debug: false } as never,
    })
    emit.mockClear()

    onHandlers.get('run:virtual:copy:all')?.()

    await vi.waitFor(() => {
      expect(error).toHaveBeenCalledWith('[virtual] Copy failed:', expect.any(Error))
      expect(emit).toHaveBeenCalledWith('virtual:failed', {
        operation: 'copy:all',
        message: 'copy exploded',
      })
    })
  })

  it('emits virtual:failed when a watch sync fails', async () => {
    const { default: runVirtual, emit, copyToVirtual, error } = await importWorkerModule()
    copyToVirtual.mockRejectedValue(new Error('rewrite exploded'))

    await runVirtual({
      sourceDir: '/workspace/app',
      config: { include: ['src/**/*'], debug: false } as never,
    })
    emit.mockClear()

    await onHandlers.get('run:virtual:sync:file')?.({
      event: 'add',
      path: '/workspace/app/src/button.tsx',
    })

    expect(error).toHaveBeenCalledWith(
      '[virtual] Failed to process',
      'add',
      '/workspace/app/src/button.tsx',
      expect.any(Error)
    )
    expect(emit).toHaveBeenCalledWith('virtual:failed', {
      operation: 'sync:file',
      event: 'add',
      path: '/workspace/app/src/button.tsx',
      message: 'rewrite exploded',
    })
  })
})
