import { describe, expect, it, vi } from 'vitest'
import type { TsPackagerWorkerPayload } from './types'

function createPayload(): TsPackagerWorkerPayload {
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
    watchMode: false,
  }
}

describe('packager/ts/execute-dts', () => {
  it('limits runtime declaration generation to runtime packages', async () => {
    const installPackagesTs = vi.fn().mockResolvedValue(undefined)

    vi.resetModules()
    vi.doMock('./install', () => ({
      installPackagesTs,
    }))
    vi.doMock('../../lib/log', () => ({
      log: { debug: vi.fn() },
    }))
    vi.doMock('../../lib/profiler', () => ({
      logProfilerSample: vi.fn(),
    }))

    const { executePackagerTsDts } = await import('./execute-dts')
    await executePackagerTsDts(createPayload(), 'packager-ts:runtime:complete')

    expect(installPackagesTs).toHaveBeenCalledWith('/workspace', [
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
    ])
  })

  it('limits final declaration generation to the types package', async () => {
    const installPackagesTs = vi.fn().mockResolvedValue(undefined)

    vi.resetModules()
    vi.doMock('./install', () => ({
      installPackagesTs,
    }))
    vi.doMock('../../lib/log', () => ({
      log: { debug: vi.fn() },
    }))
    vi.doMock('../../lib/profiler', () => ({
      logProfilerSample: vi.fn(),
    }))

    const { executePackagerTsDts } = await import('./execute-dts')
    await executePackagerTsDts(createPayload(), 'packager-ts:complete')

    expect(installPackagesTs).toHaveBeenCalledWith('/workspace', [
      {
        name: '@reference-ui/types',
        sourceEntry: 'src/entry/types.ts',
        outFile: 'types.mjs',
      },
    ])
  })
})
