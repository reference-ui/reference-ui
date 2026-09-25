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
      fileId: '/workspace/src/reference.ts',
      message: 'scanner warning',
    },
  ]

  return {
    sourceDir: '/workspace',
    outputDir: `/workspace/${DEFAULT_OUT_DIR}/types/tasty`,
    manifestPath: `/workspace/${DEFAULT_OUT_DIR}/types/tasty/manifest.js`,
    warnings: ['scanner warning'],
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

  const logReferenceBuilt = vi.fn()
  const logReferenceError = vi.fn()
  const reportRefDiagnostics = vi.fn()
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
    logReferenceBuilt,
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
    logReferenceBuilt,
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
    const { onRunBuild, logReferenceBuilt, reportRefDiagnostics, loadSymbolByName } = await importRunModule()

    const result = await onRunBuild(testPhasePayload(), { name: 'ButtonProps' })

    expect(loadSymbolByName).toHaveBeenCalledWith('ButtonProps')
    expect(reportRefDiagnostics).toHaveBeenCalledTimes(1)
    expect(reportRefDiagnostics).toHaveBeenCalledWith(
      [{ severity: 'warning', message: 'scanner warning', file: '/workspace/src/reference.ts' }],
      { verbose: false }
    )
    expect(logReferenceBuilt).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      status: 'complete',
      name: 'ButtonProps',
      symbolId: 'symbol:ButtonProps',
      source: 'project',
      manifestPath: `/workspace/${DEFAULT_OUT_DIR}/types/tasty/manifest.js`,
      outputDir: `/workspace/${DEFAULT_OUT_DIR}/types/tasty`,
      warningCount: 1,
      diagnosticCount: 1,
      diagnostics: [
        expect.objectContaining({
          fileId: '/workspace/src/reference.ts',
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
    })
  })

  it('hands the reporter an empty list when the build reports no diagnostics', async () => {
    const { onRunBuild, reportRefDiagnostics } = await importRunModule({
      rebuildImpl: async () => {
        const stub = createTastyStateStub(vi.fn())
        return { ...stub, warnings: [], diagnostics: [] }
      },
    })

    const result = await onRunBuild(testPhasePayload(), {})

    expect(reportRefDiagnostics).toHaveBeenCalledWith([], { verbose: false })
    expect(result).toEqual(
      expect.objectContaining({ status: 'complete', warningCount: 0, diagnosticCount: 0 })
    )
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
