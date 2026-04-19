import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TastyBuildDiagnostic } from '@reference-ui/rust/tasty/build'

import { DEFAULT_OUT_DIR } from '../constants'

async function importRunModule(options?: {
  rebuildImpl?: () => Promise<unknown>
  loadSymbolImpl?: (name: string) => Promise<{ getId(): string }>
}) {
  vi.resetModules()

  const emit = vi.fn()
  const debug = vi.fn()
  const error = vi.fn()
  const logReferenceBuilt = vi.fn()
  const logReferenceWarning = vi.fn()
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
      virtualDir: `/workspace/${DEFAULT_OUT_DIR}/virtual`,
      outputDir: `/workspace/${DEFAULT_OUT_DIR}/types/tasty`,
      manifestPath: `/workspace/${DEFAULT_OUT_DIR}/types/tasty/manifest.js`,
      warnings: ['scanner warning'],
      diagnostics,
      api: {
        loadSymbolByName,
      },
    }
  })

  vi.doMock('../lib/event-bus', () => ({
    emit,
  }))
  vi.doMock('../lib/log', () => ({
    log: {
      debug,
      error,
    },
  }))
  vi.doMock('./bridge/logging', () => ({
    logReferenceBuilt,
    logReferenceWarning,
  }))
  vi.doMock('./bridge/tasty-build', () => ({
    rebuildReferenceTastyBuild,
  }))

  const mod = await import('./bridge/run')
  return {
    ...mod,
    emit,
    debug,
    error,
    logReferenceBuilt,
    logReferenceWarning,
    loadSymbolByName,
    rebuildReferenceTastyBuild,
  }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../lib/event-bus')
  vi.doUnmock('../lib/log')
  vi.doUnmock('./bridge/logging')
  vi.doUnmock('./bridge/tasty-build')
  vi.restoreAllMocks()
})

describe('reference/bridge/run', () => {
  it('logs diagnostics and emits structured build details on success', async () => {
    const {
      onRunBuild,
      emit,
      debug,
      logReferenceBuilt,
      logReferenceWarning,
      loadSymbolByName,
    } = await importRunModule()

    await onRunBuild(
      {
        sourceDir: '/workspace',
        config: { include: ['src/**/*.{ts,tsx}'], name: 'fixture' },
      },
      { name: 'ButtonProps' }
    )

    expect(loadSymbolByName).toHaveBeenCalledWith('ButtonProps')
    expect(logReferenceWarning).toHaveBeenCalledWith('/workspace/src/reference.ts: scanner warning')
    expect(logReferenceBuilt).toHaveBeenCalledTimes(1)
    expect(debug).toHaveBeenCalledWith(
      'reference',
      'Reference build completed',
      expect.objectContaining({
        name: 'ButtonProps',
        warningCount: 1,
        diagnosticCount: 1,
      })
    )
    expect(emit).toHaveBeenCalledWith(
      'reference:complete',
      expect.objectContaining({
        name: 'ButtonProps',
        symbolId: 'symbol:ButtonProps',
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
    )
  })

  it('emits reference:failed when the build throws', async () => {
    const { onRunBuild, emit, error } = await importRunModule({
      rebuildImpl: async () => {
        throw new Error('build exploded')
      },
    })

    await onRunBuild(
      {
        sourceDir: '/workspace',
        config: { include: ['src/**/*.{ts,tsx}'], name: 'fixture' },
      },
      { name: 'ButtonProps' }
    )

    expect(error).toHaveBeenCalledWith('[reference] Build failed:', expect.any(Error))
    expect(emit).toHaveBeenCalledWith('reference:failed', {
      name: 'ButtonProps',
      message: 'build exploded',
    })
  })
})
