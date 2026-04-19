import { afterEach, describe, expect, it, vi } from 'vitest'
import { PRIMITIVE_JSX_NAMES } from '../../primitives/tags'

import { DEFAULT_OUT_DIR } from '../../../constants'

interface RunModuleOptions {
  cwd?: string
  config?: unknown
  outDir?: string
  cliDir?: string
  runConfigFailure?: Error
  tracedJsxNames?: string[]
}

function mockCommonRunDeps(
  options: RunModuleOptions | undefined,
  deps: {
    emit: ReturnType<typeof vi.fn>
    debug: ReturnType<typeof vi.fn>
    error: ReturnType<typeof vi.fn>
    mkdirSync: ReturnType<typeof vi.fn>
    writeFileSync: ReturnType<typeof vi.fn>
  }
): void {
  vi.doMock('../../../config', () => ({
    getCwd: () => options?.cwd,
  }))
  vi.doMock('node:fs', () => ({
    mkdirSync: deps.mkdirSync,
    writeFileSync: deps.writeFileSync,
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
    emit: deps.emit,
  }))
  vi.doMock('../../../lib/log', () => ({
    log: { debug: deps.debug, error: deps.error },
  }))
}

function mockRunWorkerDeps(
  options: RunModuleOptions | undefined,
  deps: {
    createBaseArtifacts: ReturnType<typeof vi.fn>
    writePandaExtensionsBundle: ReturnType<typeof vi.fn>
    mirrorPandaExtensionsBundle: ReturnType<typeof vi.fn>
    createPandaConfig: ReturnType<typeof vi.fn>
  },
  traceIncludedJsxElements: ReturnType<typeof vi.fn>
): void {
  vi.doMock('./styletrace', () => ({
    traceIncludedJsxElements,
  }))
  vi.doMock('../../base/create', () => ({
    createBaseArtifacts: deps.createBaseArtifacts,
  }))
  vi.doMock('./extensions/api/bundle', () => ({
    writePandaExtensionsBundle: deps.writePandaExtensionsBundle,
    mirrorPandaExtensionsBundle: deps.mirrorPandaExtensionsBundle,
  }))
  vi.doMock('./create', () => ({
    createPandaConfig: deps.createPandaConfig,
  }))
}

function setupRunModuleMocks(options?: RunModuleOptions) {
  const emit = vi.fn()
  const debug = vi.fn()
  const error = vi.fn()
  const mkdirSync = vi.fn()
  const writeFileSync = vi.fn()
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

  const traceIncludedJsxElements = vi.fn(async () =>
    options?.tracedJsxNames ?? ['MyIcon', 'Div', 'ShellCard', 'MyIcon']
  )

  mockCommonRunDeps(options, { emit, debug, error, mkdirSync, writeFileSync })
  mockRunWorkerDeps(
    options,
    {
      createBaseArtifacts,
      writePandaExtensionsBundle,
      mirrorPandaExtensionsBundle,
      createPandaConfig,
    },
    traceIncludedJsxElements
  )

  return {
    emit,
    debug,
    error,
    mkdirSync,
    writeFileSync,
    traceIncludedJsxElements,
    createBaseArtifacts,
    writePandaExtensionsBundle,
    mirrorPandaExtensionsBundle,
    createPandaConfig,
  }
}

async function importRunModule(options?: RunModuleOptions) {
  vi.resetModules()
  const mocks = setupRunModuleMocks(options)
  const mod = await import('./run')

  return {
    ...mod,
    ...mocks,
  }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../../../config')
  vi.doUnmock('node:fs')
  vi.doUnmock('../../../config/store')
  vi.doUnmock('../../../lib/paths')
  vi.doUnmock('../../../lib/paths/core-package-dir')
  vi.doUnmock('../../../lib/event-bus')
  vi.doUnmock('../../../lib/log')
  vi.doUnmock('./styletrace')
  vi.doUnmock('../../base/create')
  vi.doUnmock('./extensions/api/bundle')
  vi.doUnmock('./create')
  vi.restoreAllMocks()
})

describe('system/panda/config/run', () => {
  it('runConfig prepares base artifacts and writes panda.config with mirrored extensions runtime', async () => {
    const {
      runConfig,
      traceIncludedJsxElements,
      mkdirSync,
      writeFileSync,
      createBaseArtifacts,
      writePandaExtensionsBundle,
      mirrorPandaExtensionsBundle,
      createPandaConfig,
    } = await importRunModule({
      outDir: `/workspace/app/${DEFAULT_OUT_DIR}`,
      cliDir: '/workspace/core',
    })

    await runConfig('/workspace/app')

    expect(traceIncludedJsxElements).toHaveBeenCalledWith('/workspace/app', [
      'src/**/*.{ts,tsx}',
    ])
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
    expect(mkdirSync).toHaveBeenCalledWith(`/workspace/app/${DEFAULT_OUT_DIR}/system`, {
      recursive: true,
    })
    expect(writeFileSync).toHaveBeenCalledWith(
      `/workspace/app/${DEFAULT_OUT_DIR}/system/jsx-elements.json`,
      JSON.stringify(
        {
          primitives: PRIMITIVE_JSX_NAMES,
          traced: ['MyIcon', 'ShellCard'],
          merged: [...PRIMITIVE_JSX_NAMES, 'MyIcon', 'ShellCard'],
        },
        null,
        2
      ) + '\n',
      'utf-8'
    )
    expect(createPandaConfig).toHaveBeenCalledWith({
      outputPath: `/workspace/app/${DEFAULT_OUT_DIR}/panda.config.ts`,
      collectorBundle: expect.objectContaining({
        collectorFragments: 'collectorFragments()',
      }),
      extensionsImportPath: './styled/extensions/index.mjs',
      additionalJsxElements: ['MyIcon', 'ShellCard'],
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
