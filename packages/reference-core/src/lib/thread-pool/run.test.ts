import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

interface MockPiscinaInstance {
  options: Record<string, unknown>
  run: ReturnType<typeof vi.fn>
  destroy: ReturnType<typeof vi.fn>
  on: ReturnType<typeof vi.fn>
}

async function importRunModule() {
  vi.resetModules()

  const debug = vi.fn()
  const error = vi.fn()
  const instances: MockPiscinaInstance[] = []

  vi.doMock('../log', () => ({
    log: { debug, error },
  }))

  vi.doMock('piscina', () => ({
    default: class MockPiscina {
      options: Record<string, unknown>
      run = vi.fn()
      destroy = vi.fn().mockResolvedValue(undefined)
      on = vi.fn()

      constructor(options: Record<string, unknown>) {
        this.options = options
        instances.push(this)
      }
    },
  }))

  const mod = await import('./run')
  return { ...mod, debug, error, instances }
}

const WORKER_DATA = {
  cwd: '/Users/reference-ui/project',
  config: {
    name: 'test-system',
    include: ['src/**/*.{ts,tsx}'],
  },
}
const WORKER_PATH = '/abs/worker.mjs'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.resetModules()
  vi.doUnmock('../log')
  vi.doUnmock('piscina')
  vi.restoreAllMocks()
})

describe('thread-pool/run', () => {
  it('throws when runWorker() is called before initPool()', async () => {
    const { runWorker } = await importRunModule()

    await expect(runWorker(WORKER_PATH, { ok: true })).rejects.toThrow(
      /must be called before runWorker/i
    )
  })

  it('initializes the pool once with shared workerData', async () => {
    const { initPool, instances } = await importRunModule()

    initPool(WORKER_DATA)
    initPool(WORKER_DATA)

    expect(instances).toHaveLength(1)
    expect(instances[0]?.options).toMatchObject({
      minThreads: 2,
      maxThreads: 6,
      idleTimeout: 30000,
      workerData: WORKER_DATA,
    })
  })

  it('accepts pool size overrides', async () => {
    const { initPool, instances } = await importRunModule()

    initPool(WORKER_DATA, {
      minThreads: 3,
      maxThreads: 8,
    })

    expect(instances[0]?.options).toMatchObject({
      minThreads: 3,
      maxThreads: 8,
    })
  })

  it('runWorker() delegates payload and filename to Piscina', async () => {
    const { initPool, runWorker, instances } = await importRunModule()
    initPool(WORKER_DATA)

    instances[0]?.run.mockResolvedValue('done')

    await expect(runWorker(WORKER_PATH, { task: 1 })).resolves.toBe('done')
    expect(instances[0]?.run).toHaveBeenCalledWith({ task: 1 }, { filename: WORKER_PATH })
  })

  it('creates and reuses a dedicated pool when poolName is provided', async () => {
    const { initPool, runWorker, instances } = await importRunModule()
    initPool(WORKER_DATA)

    await expect(
      runWorker(WORKER_PATH, { task: 'a' }, { poolName: 'mcp' })
    ).resolves.toBeUndefined()

    expect(instances).toHaveLength(2)
    expect(instances[1]?.options).toMatchObject({
      minThreads: 1,
      maxThreads: 1,
      idleTimeout: 30000,
      workerData: WORKER_DATA,
    })
    expect(instances[1]?.run).toHaveBeenCalledWith(
      { task: 'a' },
      { filename: WORKER_PATH }
    )

    instances[1]?.run.mockResolvedValue('dedicated-2')
    await expect(
      runWorker(WORKER_PATH, { task: 'b' }, { poolName: 'mcp' })
    ).resolves.toBe('dedicated-2')

    expect(instances).toHaveLength(2)
  })

  it('destroys dedicated pools during shutdown()', async () => {
    const { initPool, runWorker, shutdown, instances } = await importRunModule()
    initPool(WORKER_DATA)

    instances[1]?.run.mockResolvedValue('dedicated')
    await runWorker(WORKER_PATH, { task: 'a' }, { poolName: 'mcp' })

    await shutdown()

    expect(instances[0]?.destroy).toHaveBeenCalledTimes(1)
    expect(instances[1]?.destroy).toHaveBeenCalledTimes(1)
  })

  it('can recover from a worker failure and run again', async () => {
    const { initPool, runWorker, instances } = await importRunModule()
    initPool(WORKER_DATA)

    instances[0]?.run
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('recovered')

    await expect(runWorker(WORKER_PATH, { first: true })).rejects.toThrow('boom')
    await expect(runWorker(WORKER_PATH, { second: true })).resolves.toBe('recovered')
  })

  it('logs pool error events', async () => {
    const { initPool, error, instances } = await importRunModule()
    initPool(WORKER_DATA)

    const errorHandler = instances[0]?.on.mock.calls.find(
      ([event]) => event === 'error'
    )?.[1]
    expect(typeof errorHandler).toBe('function')

    errorHandler?.(new Error('pool failed'))

    expect(error).toHaveBeenCalledWith('[pool]', expect.any(Error))
  })

  it('does not emit memory debug logs by default', async () => {
    const { initPool, shutdown, debug, instances } = await importRunModule()
    initPool(WORKER_DATA)

    expect(debug).not.toHaveBeenCalledWith(
      'memory',
      expect.any(String),
      expect.anything()
    )

    vi.advanceTimersByTime(3000)

    const callCountBeforeShutdown = debug.mock.calls.length
    await shutdown()

    expect(instances[0]?.destroy).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(6000)
    expect(debug.mock.calls.length).toBe(callCountBeforeShutdown)
  })

  it('allows re-initialization after shutdown()', async () => {
    const { initPool, shutdown, instances } = await importRunModule()

    initPool(WORKER_DATA)
    await shutdown()
    initPool(WORKER_DATA)

    expect(instances).toHaveLength(2)
  })
})
