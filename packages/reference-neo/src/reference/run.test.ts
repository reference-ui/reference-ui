// Reference bridge run suite: it takes the mocked tasty rebuild plus the mocked
// logging and reporter seams and emits the REF-07 pins — diagnostics reported
// through the unified ref channel, structured complete returned, throw mapped
// to a failed result. Neo port of the core run suite; the bus is gone, so
// assertions read the return value, not emits.

import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TastyBuildDiagnostic } from '@reference-ui/rust/tasty/build'

import { DEFAULT_OUT_DIR } from '../constants.ts'
import type { ReferenceTastyPayload } from './bridge/types.ts'

function testPhasePayload(): ReferenceTastyPayload {
  return {
    sourceDir: '/workspace',
    config: { include: ['src/**/*.{ts,tsx}'], name: 'fixture' },
  }
}

function createTastyStateStub(loadSymbolByName: unknown) {
  const diagnostics: TastyBuildDiagnostic[] = [
    {
      level: 'warning',
      source: 'scanner',
      code: 'TST-W-PARSE-ERROR',
      file: '/workspace/src/reference.ts',
      message: 'scanner warning',
    },
  ]

  return {
    sourceDir: '/workspace',
    outputDir: `/workspace/${DEFAULT_OUT_DIR}/types/tasty`,
    manifestPath: `/workspace/${DEFAULT_OUT_DIR}/types/tasty/manifest.js`,
    warnings: [
      { severity: 'warning', code: 'TST-W-PARSE-ERROR', message: 'scanner warning' },
    ],
    diagnostics,
    api: {
      loadSymbolByName,
    },
  }
}

async function importRunModule(options?: {
  rebuildImpl?: () => Promise<unknown>
  loadSymbolImpl?: (name: string) => Promise<{ getId(): string }>
}) {
  vi.resetModules()

  const logReferenceError = vi.fn()
  const reportRefDiagnostics = vi.fn().mockReturnValue(1)
  const loadSymbolByName = vi.fn(async (name: string) => {
    if (options?.loadSymbolImpl) {
      return options.loadSymbolImpl(name)
    }

    return {
      getId: () => `symbol:${name}`,
    }
  })
  const rebuildReferenceTastyBuild = vi.fn(async () => {
    if (options?.rebuildImpl) {
      return options.rebuildImpl()
    }
    return createTastyStateStub(loadSymbolByName)
  })

  vi.doMock('./bridge/logging.ts', () => ({
    logReferenceError,
  }))
  vi.doMock('../native/diagnostics.ts', () => ({
    reportRefDiagnostics,
  }))
  vi.doMock('./bridge/tasty-build.ts', () => ({
    rebuildReferenceTastyBuild,
  }))

  const mod = await import('./bridge/run.ts')
  return {
    ...mod,
    logReferenceError,
    reportRefDiagnostics,
    loadSymbolByName,
    rebuildReferenceTastyBuild,
  }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('./bridge/logging.ts')
  vi.doUnmock('../native/diagnostics.ts')
  vi.doUnmock('./bridge/tasty-build.ts')
  vi.restoreAllMocks()
})

describe('reference/bridge/run reporting', () => {
  it('reports diagnostics and returns structured build details on success', async () => {
    const { onRunBuild, reportRefDiagnostics, loadSymbolByName } = await importRunModule()

    const result = await onRunBuild(testPhasePayload(), { name: 'ButtonProps' })

    expect(loadSymbolByName).toHaveBeenCalledWith('ButtonProps')
    expect(reportRefDiagnostics).toHaveBeenCalledTimes(1)
    expect(reportRefDiagnostics).toHaveBeenCalledWith(
      [
        {
          severity: 'warning',
          code: 'TST-W-PARSE-ERROR',
          message: 'scanner warning',
          file: '/workspace/src/reference.ts',
        },
      ],
      { verbose: false, fold: false }
    )
    expect(result).toEqual({
      status: 'complete',
      name: 'ButtonProps',
      symbolId: 'symbol:ButtonProps',
      source: 'project',
      manifestPath: `/workspace/${DEFAULT_OUT_DIR}/types/tasty/manifest.js`,
      outputDir: `/workspace/${DEFAULT_OUT_DIR}/types/tasty`,
      warningCount: 1,
      diagnosticCount: 1,
      reportedWarningCount: 1,
      diagnostics: [
        expect.objectContaining({
          code: 'TST-W-PARSE-ERROR',
          file: '/workspace/src/reference.ts',
          message: 'scanner warning',
        }),
      ],
    })
  })

  it('threads verbose through to the ref reporter', async () => {
    const { onRunBuild, reportRefDiagnostics } = await importRunModule()

    await onRunBuild(testPhasePayload(), { verbose: true })

    expect(reportRefDiagnostics).toHaveBeenCalledTimes(1)
    expect(reportRefDiagnostics).toHaveBeenCalledWith(expect.any(Array), {
      verbose: true,
      fold: false,
    })
  })

  it('threads fold through and returns the reporter count on success', async () => {
    const { onRunBuild, reportRefDiagnostics } = await importRunModule()
    reportRefDiagnostics.mockReturnValue(2)

    const result = await onRunBuild(testPhasePayload(), { fold: true })

    expect(reportRefDiagnostics).toHaveBeenCalledWith(expect.any(Array), { verbose: false, fold: true })
    expect(result).toEqual(expect.objectContaining({ status: 'complete', reportedWarningCount: 2 }))
  })

  it('hands the reporter an empty list when the build reports no diagnostics', async () => {
    const { onRunBuild, reportRefDiagnostics } = await importRunModule({
      rebuildImpl: async () => {
        const stub = createTastyStateStub(vi.fn())
        return { ...stub, warnings: [], diagnostics: [] }
      },
    })

    const result = await onRunBuild(testPhasePayload(), {})

    expect(reportRefDiagnostics).toHaveBeenCalledWith([], { verbose: false, fold: false })
    expect(result).toEqual(
      expect.objectContaining({ status: 'complete', warningCount: 0, diagnosticCount: 0 })
    )
  })

  it('prints the ref array on stdout for unfolded json landings only', async () => {
    const { onRunBuild } = await importRunModule()
    const logged = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      await onRunBuild(testPhasePayload(), { json: true })
      expect(logged).toHaveBeenCalledTimes(1)
      expect(logged).toHaveBeenCalledWith(expect.stringMatching(/^\[.*\]$/))
    } finally {
      logged.mockRestore()
    }
  })

  it('stays silent on stdout for folded json builds; the caller prints', async () => {
    const { onRunBuild } = await importRunModule()
    const logged = vi.spyOn(console, 'log').mockImplementation(() => {})
    try {
      await onRunBuild(testPhasePayload(), { json: true, fold: true })
      expect(logged).not.toHaveBeenCalled()
    } finally {
      logged.mockRestore()
    }
  })
})

describe('reference/bridge/run outcomes', () => {
  it('skips the symbol lookup when no name is requested', async () => {
    const { onRunBuild, loadSymbolByName } = await importRunModule()

    const result = await onRunBuild(testPhasePayload(), {})

    expect(loadSymbolByName).not.toHaveBeenCalled()
    expect(result).toEqual(
      expect.objectContaining({ status: 'complete', symbolId: undefined })
    )
  })

  it('returns a failed result when the build throws', async () => {
    const { onRunBuild, logReferenceError, reportRefDiagnostics } = await importRunModule({
      rebuildImpl: async () => {
        throw new Error('build exploded')
      },
    })

    const result = await onRunBuild(testPhasePayload(), { name: 'ButtonProps' })

    expect(logReferenceError).toHaveBeenCalledWith(expect.any(Error))
    expect(reportRefDiagnostics).not.toHaveBeenCalled()
    expect(result).toEqual({
      status: 'failed',
      name: 'ButtonProps',
      message: 'build exploded',
    })
  })
})
