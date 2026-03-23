import { describe, expect, it, vi } from 'vitest'
import { createDtsGenerationQueue } from './run'
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
  it('serializes overlapping declaration runs', async () => {
    let resolveFirstRun: (() => void) | undefined
    const firstRun = new Promise<void>((resolve) => {
      resolveFirstRun = resolve
    })
    const runGeneration = vi
      .fn<(_: TsPackagerWorkerPayload) => Promise<void>>()
      .mockReturnValueOnce(firstRun)
      .mockResolvedValueOnce(undefined)
    const queue = createDtsGenerationQueue(createPayload(false), { runGeneration })

    void queue.run('packager-ts:complete')
    void queue.run('packager-ts:complete')
    await Promise.resolve()
    await Promise.resolve()

    expect(runGeneration).toHaveBeenCalledTimes(1)

    resolveFirstRun?.()
    await firstRun
    await vi.waitFor(() => {
      expect(runGeneration).toHaveBeenCalledTimes(2)
    })
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
})
