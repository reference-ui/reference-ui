import { afterEach, describe, expect, it, vi } from 'vitest'
import manifest from '../../../workers.json'

async function importRegistryModule() {
  vi.resetModules()

  const createWorkerPool = vi.fn(() => ({
    WORKERS: { mocked: '/dist/mock.mjs' },
    runWorker: vi.fn(),
  }))

  vi.doMock('./create-pool', () => ({
    createWorkerPool,
  }))

  const mod = await import('./registry')
  return { ...mod, createWorkerPool }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('./create-pool')
  vi.restoreAllMocks()
})

describe('thread-pool registry', () => {
  it('builds workers from workers.json via createWorkerPool()', async () => {
    const { workers, createWorkerPool } = await importRegistryModule()

    expect(createWorkerPool).toHaveBeenCalledWith(manifest)
    expect(workers).toEqual({
      WORKERS: { mocked: '/dist/mock.mjs' },
      runWorker: expect.any(Function),
    })
  })

  it('builds tsup worker entries from workers.json', async () => {
    const { workerEntries } = await importRegistryModule()

    expect(workerEntries).toEqual({
      'watch/worker': 'src/watch/worker.ts',
      'virtual/worker': 'src/virtual/worker.ts',
      'config/worker': 'src/system/workers/config.ts',
      'panda/worker': 'src/system/workers/panda.ts',
      'packager/worker': 'src/packager/worker.ts',
      'packager-ts/worker': 'src/packager/ts/worker.ts',
    })
  })
})
