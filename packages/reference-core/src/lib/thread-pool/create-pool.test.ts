import { afterEach, describe, expect, it, vi } from 'vitest'

async function importCreatePoolModule() {
  vi.resetModules()

  const runPoolWorker = vi.fn()
  const error = vi.fn()
  const resolveCoreDistPath = vi.fn((relativePath: string) => `/dist/${relativePath}`)

  vi.doMock('./run', () => ({
    runWorker: runPoolWorker,
  }))
  vi.doMock('../log', () => ({
    log: { error },
  }))
  vi.doMock('../paths', () => ({
    resolveCoreDistPath,
  }))

  const mod = await import('./create-pool')
  return { ...mod, runPoolWorker, error, resolveCoreDistPath }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('./run')
  vi.doUnmock('../log')
  vi.doUnmock('../paths')
  vi.restoreAllMocks()
})

describe('createWorkerPool', () => {
  it('builds WORKERS from the manifest keys', async () => {
    const { createWorkerPool, resolveCoreDistPath } = await importCreatePoolModule()

    const pool = createWorkerPool({
      watch: 'ignored',
      panda: 'ignored',
    })

    expect(resolveCoreDistPath).toHaveBeenCalledWith('watch/worker.mjs')
    expect(resolveCoreDistPath).toHaveBeenCalledWith('panda/worker.mjs')
    expect(pool.WORKERS).toEqual({
      watch: '/dist/watch/worker.mjs',
      panda: '/dist/panda/worker.mjs',
    })
  })

  it('runs a worker by logical name using the resolved path', async () => {
    const { createWorkerPool, runPoolWorker } = await importCreatePoolModule()
    const pool = createWorkerPool({ watch: 'ignored' })

    runPoolWorker.mockResolvedValue('done')

    await expect(pool.runWorker('watch', { task: true })).resolves.toBe('done')
    expect(runPoolWorker).toHaveBeenCalledWith(
      '/dist/watch/worker.mjs',
      { task: true },
      undefined
    )
  })

  it('accepts an explicit worker path directly', async () => {
    const { createWorkerPool, runPoolWorker } = await importCreatePoolModule()
    const pool = createWorkerPool({ watch: 'ignored' })

    runPoolWorker.mockResolvedValue('done')

    await expect(pool.runWorker('/abs/custom-worker.mjs', { task: true })).resolves.toBe(
      'done'
    )
    expect(runPoolWorker).toHaveBeenCalledWith(
      '/abs/custom-worker.mjs',
      { task: true },
      undefined
    )
  })

  it('passes pool options through to the worker runner', async () => {
    const { createWorkerPool, runPoolWorker } = await importCreatePoolModule()
    const pool = createWorkerPool({ mcp: 'ignored' })

    runPoolWorker.mockResolvedValue('done')

    await expect(
      pool.runWorker('mcp', { task: true }, { poolName: 'mcp' })
    ).resolves.toBe('done')
    expect(runPoolWorker).toHaveBeenCalledWith(
      '/dist/mcp/worker.mjs',
      { task: true },
      { poolName: 'mcp' }
    )
  })

  it('logs worker failures instead of throwing from the wrapper', async () => {
    const { createWorkerPool, runPoolWorker, error } = await importCreatePoolModule()
    const pool = createWorkerPool({ watch: 'ignored' })

    runPoolWorker.mockRejectedValue(new Error('worker exploded'))

    await expect(pool.runWorker('watch', { task: true })).resolves.toBeUndefined()
    expect(error).toHaveBeenCalledWith('[watch] Worker failed:', expect.any(Error))
  })

  it('does not log expected worker termination during pool shutdown', async () => {
    const { createWorkerPool, runPoolWorker, error } = await importCreatePoolModule()
    const pool = createWorkerPool({ watch: 'ignored' })

    runPoolWorker.mockRejectedValue(new Error('Terminating worker thread'))

    await expect(pool.runWorker('watch', { task: true })).resolves.toBeUndefined()
    expect(error).not.toHaveBeenCalled()
  })
})
