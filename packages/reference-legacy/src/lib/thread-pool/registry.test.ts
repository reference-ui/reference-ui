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

    const expectedEntries = Object.fromEntries(
      Object.entries(manifest as Record<string, string>).map(([name, src]) => [
        `${name}/worker`,
        src,
      ])
    )

    expect(workerEntries).toEqual(expectedEntries)
  })
})
