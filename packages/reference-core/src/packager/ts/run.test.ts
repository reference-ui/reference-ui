import { describe, expect, it, vi } from 'vitest'
import { createDtsGenerationRuntime } from './run'
import type { TsPackagerWorkerPayload } from './types'

function createPayload(watchMode: boolean): TsPackagerWorkerPayload {
  return {
    cwd: '/workspace',
    config: {} as never,
    packages: [
      { name: '@reference-ui/react', sourceEntry: 'src/entry/react.ts', outFile: 'react.mjs' },
      { name: '@reference-ui/system', sourceEntry: 'src/entry/system.ts', outFile: 'system.mjs' },
    ],
    watchMode,
  }
}

describe('packager/ts/run', () => {
  it('does not run catch-up generation for one-shot sync', async () => {
    const runGeneration = vi.fn().mockResolvedValue(undefined)
    const runtime = createDtsGenerationRuntime(createPayload(false), {
      bundlesReady: true,
      runGeneration,
    })

    await runtime.runCatchUpIfNeeded()

    expect(runGeneration).not.toHaveBeenCalled()
  })

  it('runs catch-up generation in watch mode when outputs already exist', async () => {
    const runGeneration = vi.fn().mockResolvedValue(undefined)
    const runtime = createDtsGenerationRuntime(createPayload(true), {
      bundlesReady: true,
      runGeneration,
    })

    await runtime.runCatchUpIfNeeded()

    expect(runGeneration).toHaveBeenCalledTimes(1)
  })

  it('serializes overlapping packager:complete callbacks', async () => {
    let resolveFirstRun: (() => void) | undefined
    const firstRun = new Promise<void>((resolve) => {
      resolveFirstRun = resolve
    })
    const runGeneration = vi
      .fn<(_: TsPackagerWorkerPayload) => Promise<void>>()
      .mockReturnValueOnce(firstRun)
      .mockResolvedValueOnce(undefined)
    const runtime = createDtsGenerationRuntime(createPayload(false), {
      bundlesReady: false,
      runGeneration,
    })

    runtime.onPackagerComplete()
    runtime.onPackagerComplete()
    await Promise.resolve()

    expect(runGeneration).toHaveBeenCalledTimes(1)

    resolveFirstRun?.()
    await firstRun
    await Promise.resolve()
    await Promise.resolve()

    expect(runGeneration).toHaveBeenCalledTimes(2)
  })

  it('runs runtime declaration generation when runtime packages complete', async () => {
    const runGeneration = vi.fn().mockResolvedValue(undefined)
    const runtime = createDtsGenerationRuntime(createPayload(false), {
      bundlesReady: false,
      runGeneration,
    })

    runtime.onPackagerRuntimeComplete()
    await Promise.resolve()

    expect(runGeneration).toHaveBeenCalledWith(
      expect.objectContaining({ cwd: '/workspace' }),
      'packager-ts:runtime:complete'
    )
  })
})
