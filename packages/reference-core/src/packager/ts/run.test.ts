import { describe, expect, it, vi } from 'vitest'
import { createDtsGenerationQueue } from './run'
import type { TsPackagerWorkerPayload } from './types'

function createPayload(watchMode: boolean): TsPackagerWorkerPayload {
  return {
    cwd: '/workspace',
    config: {} as never,
    packages: [
      {
        name: '@reference-ui/react',
        sourceEntry: 'src/entry/react.ts',
        outFile: 'react.mjs',
      },
      {
        name: '@reference-ui/system',
        sourceEntry: 'src/entry/system.ts',
        outFile: 'system.mjs',
      },
      {
        name: '@reference-ui/types',
        sourceEntry: 'src/entry/types.ts',
        outFile: 'types.mjs',
      },
    ],
    watchMode,
  }
}

describe('packager/ts/run', () => {
  it('limits runtime declaration generation to runtime packages', async () => {
    const spawnPackagerTsDtsChild = vi.fn().mockResolvedValue(undefined)
    const emit = vi.fn()

    vi.resetModules()
    vi.doMock('./child-process/process', () => ({
      spawnPackagerTsDtsChild,
    }))
    vi.doMock('../../lib/event-bus', () => ({
      emit,
    }))
    vi.doMock('../../lib/log', () => ({
      log: {
        debug: vi.fn(),
        error: vi.fn(),
      },
    }))

    const { runDtsGeneration } = await import('./run')
    await runDtsGeneration(createPayload(false), 'packager-ts:runtime:complete')

    expect(spawnPackagerTsDtsChild).toHaveBeenCalledWith(
      expect.objectContaining({ cwd: '/workspace' }),
      'packager-ts:runtime:complete'
    )
    expect(emit).toHaveBeenCalledWith('packager-ts:runtime:complete', {})
  })

  it('limits final declaration generation to the types package', async () => {
    const spawnPackagerTsDtsChild = vi.fn().mockResolvedValue(undefined)
    const emit = vi.fn()

    vi.resetModules()
    vi.doMock('./child-process/process', () => ({
      spawnPackagerTsDtsChild,
    }))
    vi.doMock('../../lib/event-bus', () => ({
      emit,
    }))
    vi.doMock('../../lib/log', () => ({
      log: {
        debug: vi.fn(),
        error: vi.fn(),
      },
    }))

    const { runDtsGeneration } = await import('./run')
    await runDtsGeneration(createPayload(false), 'packager-ts:complete')

    expect(spawnPackagerTsDtsChild).toHaveBeenCalledWith(
      expect.objectContaining({ cwd: '/workspace' }),
      'packager-ts:complete'
    )
    expect(emit).toHaveBeenCalledWith('packager-ts:complete', {})
  })

  it('serializes overlapping declaration runs', async () => {
    let resolveFirstRun: (() => void) | undefined
    const firstRun = new Promise<void>(resolve => {
      resolveFirstRun = resolve
    })
    const runGeneration = vi
      .fn<(_: TsPackagerWorkerPayload) => Promise<void>>()
      .mockReturnValueOnce(firstRun)
      .mockResolvedValueOnce(undefined)
    const queue = createDtsGenerationQueue(createPayload(false), { runGeneration })

    const firstRequest = queue.run('packager-ts:complete')
    const secondRequest = queue.run('packager-ts:complete')
    await Promise.resolve()
    await Promise.resolve()

    expect(runGeneration).toHaveBeenCalledTimes(1)

    resolveFirstRun?.()
    await firstRun
    await vi.waitFor(() => {
      expect(runGeneration).toHaveBeenCalledTimes(2)
    })
    await Promise.all([firstRequest, secondRequest])
  })

  it('passes the requested completion event through to the generator', async () => {
    const runGeneration = vi.fn().mockResolvedValue(undefined)
    const queue = createDtsGenerationQueue(createPayload(false), { runGeneration })
    await queue.run('packager-ts:runtime:complete')

    expect(runGeneration).toHaveBeenCalledWith(
      expect.objectContaining({ cwd: '/workspace' }),
      'packager-ts:runtime:complete'
    )
  })

  it('emits packager-ts:failed when declaration generation fails', async () => {
    const emit = vi.fn()
    const runGeneration = vi.fn().mockRejectedValue(new Error('boom'))

    vi.resetModules()
    vi.doMock('../../lib/event-bus', () => ({
      emit,
    }))
    vi.doMock('../../lib/log', () => ({
      log: {
        debug: vi.fn(),
        error: vi.fn(),
      },
    }))

    const { createDtsGenerationQueue } = await import('./run')
    const queue = createDtsGenerationQueue(createPayload(false), { runGeneration })

    await queue.run('packager-ts:complete')

    expect(emit).toHaveBeenCalledWith('packager-ts:failed', {})
  })
})
