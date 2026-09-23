// Reference bridge run suite: it takes the mocked tasty rebuild plus the mocked
// logging seam and emits the REF-07 pins — diagnostics logged, structured
// complete returned, throw mapped to a failed result. Neo port of the core
// run suite; the bus is gone, so assertions read the return value, not emits.

import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TastyBuildDiagnostic } from '@reference-ui/rust/tasty/build'

import { DEFAULT_OUT_DIR } from '../constants.ts'

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
  const logReferenceWarning = vi.fn()
  const logReferenceCompleted = vi.fn()
  const logReferenceError = vi.fn()
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
    logReferenceWarning,
    logReferenceCompleted,
    logReferenceError,
  }))
  vi.doMock('./bridge/tasty-build.ts', () => ({
    rebuildReferenceTastyBuild,
  }))

  const mod = await import('./bridge/run.ts')
  return {
    ...mod,
    logReferenceBuilt,
    logReferenceWarning,
    logReferenceCompleted,
    logReferenceError,
    loadSymbolByName,
    rebuildReferenceTastyBuild,
  }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('./bridge/logging.ts')
  vi.doUnmock('./bridge/tasty-build.ts')
  vi.restoreAllMocks()
})

describe('reference/bridge/run', () => {
  it('logs diagnostics and returns structured build details on success', async () => {
    const {
      onRunBuild,
      logReferenceBuilt,
      logReferenceWarning,
      logReferenceCompleted,
      loadSymbolByName,
    } = await importRunModule()

    const result = await onRunBuild(
      {
        sourceDir: '/workspace',
        config: { include: ['src/**/*.{ts,tsx}'], name: 'fixture' },
      },
      { name: 'ButtonProps' }
    )

    expect(loadSymbolByName).toHaveBeenCalledWith('ButtonProps')
    expect(logReferenceWarning).toHaveBeenCalledWith('/workspace/src/reference.ts: scanner warning')
    expect(logReferenceBuilt).toHaveBeenCalledTimes(1)
    expect(logReferenceCompleted).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'ButtonProps',
        symbolId: 'symbol:ButtonProps',
        source: 'project',
        manifestPath: `/workspace/${DEFAULT_OUT_DIR}/types/tasty/manifest.js`,
        outputDir: `/workspace/${DEFAULT_OUT_DIR}/types/tasty`,
        warningCount: 1,
        diagnosticCount: 1,
      })
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
      diagnostics: [
        expect.objectContaining({
          fileId: '/workspace/src/reference.ts',
          message: 'scanner warning',
        }),
      ],
    })
  })

  it('skips the symbol lookup when no name is requested', async () => {
    const { onRunBuild, loadSymbolByName } = await importRunModule()

    const result = await onRunBuild(
      {
        sourceDir: '/workspace',
        config: { include: ['src/**/*.{ts,tsx}'], name: 'fixture' },
      },
      {}
    )

    expect(loadSymbolByName).not.toHaveBeenCalled()
    expect(result).toEqual(
      expect.objectContaining({ status: 'complete', symbolId: undefined })
    )
  })

  it('returns a failed result when the build throws', async () => {
    const { onRunBuild, logReferenceError } = await importRunModule({
      rebuildImpl: async () => {
        throw new Error('build exploded')
      },
    })

    const result = await onRunBuild(
      {
        sourceDir: '/workspace',
        config: { include: ['src/**/*.{ts,tsx}'], name: 'fixture' },
      },
      { name: 'ButtonProps' }
    )

    expect(logReferenceError).toHaveBeenCalledWith(expect.any(Error))
    expect(result).toEqual({
      status: 'failed',
      name: 'ButtonProps',
      message: 'build exploded',
    })
  })
})
