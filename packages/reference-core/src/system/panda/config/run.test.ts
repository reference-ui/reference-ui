import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_OUT_DIR } from '../../../constants'

async function importRunModule(options?: {
  cwd?: string
  config?: unknown
  outDir?: string
  cliDir?: string
  runConfigFailure?: Error
}) {
  vi.resetModules()

  const emit = vi.fn()
  const debug = vi.fn()
  const error = vi.fn()
  const createBaseArtifacts = vi.fn(async () => {
    if (options?.runConfigFailure) throw options.runConfigFailure
    return {
      collectorBundle: {
        collectorFragments: 'collectorFragments()',
        getValue: vi.fn((name: string) => `get:${name}`),
      },
      baseSystem: {
        name: 'test-system',
        fragment: ';fragment()',
      },
    }
  })
  const writePandaExtensionsBundle = vi.fn(async () => {})
  const mirrorPandaExtensionsBundle = vi.fn()
  const createPandaConfig = vi.fn(async () => {
    if (options?.runConfigFailure) throw options.runConfigFailure
  })

  vi.doMock('../../../config', () => ({
    getCwd: () => options?.cwd,
  }))
  vi.doMock('../../../config/store', () => ({
    getConfig: () => options?.config ?? { name: 'test-system', include: ['src/**/*.{ts,tsx}'] },
  }))
  vi.doMock('../../../lib/paths', () => ({
    getOutDirPath: () => options?.outDir ?? `/workspace/${DEFAULT_OUT_DIR}`,
  }))
  vi.doMock('../../../lib/paths/core-package-dir', () => ({
    resolveCorePackageDir: () => options?.cliDir ?? '/workspace/core',
  }))
  vi.doMock('../../../lib/event-bus', () => ({
    emit,
  }))
  vi.doMock('../../../lib/log', () => ({
    log: { debug, error },
  }))
  vi.doMock('../../base/create', () => ({
    createBaseArtifacts,
  }))
  vi.doMock('./extensions/api/bundle', () => ({
    writePandaExtensionsBundle,
    mirrorPandaExtensionsBundle,
  }))
  vi.doMock('./create', () => ({
    createPandaConfig,
  }))

  const mod = await import('./run')
  return {
    ...mod,
    emit,
    debug,
    error,
    createBaseArtifacts,
    writePandaExtensionsBundle,
    mirrorPandaExtensionsBundle,
    createPandaConfig,
  }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../../../config')
  vi.doUnmock('../../../config/store')
  vi.doUnmock('../../../lib/paths')
  vi.doUnmock('../../../lib/paths/core-package-dir')
  vi.doUnmock('../../../lib/event-bus')
  vi.doUnmock('../../../lib/log')
  vi.doUnmock('../../base/create')
  vi.doUnmock('./extensions/api/bundle')
  vi.doUnmock('./create')
  vi.restoreAllMocks()
})

describe('system/panda/config/run', () => {
  it('runConfig prepares base artifacts and writes panda.config with mirrored extensions runtime', async () => {
    const {
      runConfig,
      createBaseArtifacts,
      writePandaExtensionsBundle,
      mirrorPandaExtensionsBundle,
      createPandaConfig,
    } = await importRunModule({
      outDir: `/workspace/app/${DEFAULT_OUT_DIR}`,
      cliDir: '/workspace/core',
    })

    await runConfig('/workspace/app')

    expect(createBaseArtifacts).toHaveBeenCalledWith('/workspace/app', {
      name: 'test-system',
      include: ['src/**/*.{ts,tsx}'],
    })
    expect(writePandaExtensionsBundle).toHaveBeenCalledWith(
      '/workspace/core',
      '/workspace/core/src/system/styled'
    )
    expect(mirrorPandaExtensionsBundle).toHaveBeenCalledWith(
      '/workspace/core/src/system/styled',
      `/workspace/app/${DEFAULT_OUT_DIR}`
    )
    expect(createPandaConfig).toHaveBeenCalledWith({
      outputPath: `/workspace/app/${DEFAULT_OUT_DIR}/panda.config.ts`,
      collectorBundle: expect.objectContaining({
        collectorFragments: 'collectorFragments()',
      }),
      extensionsImportPath: './styled/extensions/index.mjs',
    })
  })

  it('onRunConfig logs and emits failed when cwd is missing', async () => {
    const { onRunConfig, error, emit } = await importRunModule({ cwd: undefined })

    onRunConfig()

    expect(error).toHaveBeenCalledWith('[config] run:system:config: getCwd() is undefined')
    expect(emit).toHaveBeenCalledWith('system:config:failed')
  })

  it('onRunConfig emits complete after a successful config run', async () => {
    const { onRunConfig, emit } = await importRunModule({ cwd: '/workspace/app' })

    onRunConfig()

    await vi.waitFor(() => {
      expect(emit).toHaveBeenCalledWith('system:config:complete')
    })
  })

  it('onRunConfig logs failures and emits failed (not complete)', async () => {
    const { onRunConfig, error, emit } = await importRunModule({
      cwd: '/workspace/app',
      runConfigFailure: new Error('base artifacts exploded'),
    })

    onRunConfig()

    await vi.waitFor(() => {
      expect(error).toHaveBeenCalledWith(
        '[config] runConfig failed',
        'base artifacts exploded',
        expect.any(String)
      )
      expect(emit).toHaveBeenCalledWith('system:config:failed')
    })
  })
})
