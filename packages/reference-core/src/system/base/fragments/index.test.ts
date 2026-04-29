import { afterEach, describe, expect, it, vi } from 'vitest'

async function importFragmentsModule(options?: {
  coreDir?: string
  scannedFiles?: string[]
  bundledFragments?: Array<{ file: string; bundle: string }>
  collectorBundle?: unknown
  internalPatternFiles?: string[]
}) {
  vi.resetModules()

  const scanForFragments = vi.fn(() => options?.scannedFiles ?? ['/workspace/app/src/theme.ts'])
  const bundleFragments = vi.fn(async () =>
    options?.bundledFragments ?? [{ file: '/workspace/app/src/theme.ts', bundle: 'localOne()' }]
  )
  const resolveCorePackageDir = vi.fn(() => options?.coreDir ?? '/workspace/core')
  const resolveInternalPatternFiles = vi.fn(() =>
    options?.internalPatternFiles ?? ['/workspace/core/src/system/panda/config/extensions/container/container.ts']
  )

  vi.doMock('../../../lib/fragments', () => ({
    scanForFragments,
    bundleFragments,
  }))
  vi.doMock('../../../lib/paths/core-package-dir', () => ({
    resolveCorePackageDir,
  }))
  vi.doMock('../../panda/config/extensions/api/bundle', () => ({
    resolveInternalPatternFiles,
  }))

  const mod = await import('./index')
  return {
    ...mod,
    scanForFragments,
    bundleFragments,
    resolveCorePackageDir,
    resolveInternalPatternFiles,
  }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../../../lib/fragments')
  vi.doUnmock('../../../lib/paths/core-package-dir')
  vi.doUnmock('../../panda/config/extensions/api/bundle')
  vi.restoreAllMocks()
})

describe('system/base/fragments', () => {
  it('filters upstream fragments to non-empty strings only', async () => {
    const { getUpstreamFragments } = await importFragmentsModule()

    expect(
      getUpstreamFragments([
        { name: 'good-one', fragment: 'one()' },
        { name: 'blank', fragment: '   ' },
        { name: 'missing' } as never,
        { name: 'good-two', fragment: 'two()' },
      ])
    ).toEqual(['one()', 'two()'])
    expect(getUpstreamFragments(undefined)).toEqual([])
  })

  it('maps bootstrap fragment imports back to core source entries', async () => {
    await importFragmentsModule({
      coreDir: '/workspace/packages/reference-core',
    })
    const { getBaseFragmentBootstrapImportMap } = await import('./bootstrap-import-map')

    expect(getBaseFragmentBootstrapImportMap('/workspace/app')).toEqual({
      '@reference-ui/system': '/workspace/packages/reference-core/src/entry/system.ts',
      '@reference-ui/core/config': '/workspace/packages/reference-core/src/entry/system.ts',
      '@reference-ui/cli/config': '/workspace/packages/reference-core/src/entry/system.ts',
      '@reference-ui/react': '/workspace/packages/reference-core/src/entry/react.ts',
      '@reference-ui/styled/css': '/workspace/packages/reference-core/src/system/styled/css/index.js',
      '@reference-ui/styled/css/cva': '/workspace/packages/reference-core/src/system/styled/css/cva.js',
      '@reference-ui/styled/jsx': '/workspace/packages/reference-core/src/system/styled/jsx/index.js',
      '@reference-ui/styled/patterns/box': '/workspace/packages/reference-core/src/system/styled/patterns/box.js',
    })
  })

  it('prepares base fragments from scanned files and bundled local fragments', async () => {
    const {
      prepareBaseFragments,
      scanForFragments,
      bundleFragments,
    } = await importFragmentsModule({
      scannedFiles: ['/workspace/app/src/theme.ts', '/workspace/app/src/recipes.ts'],
      bundledFragments: [
        { file: '/workspace/app/src/theme.ts', bundle: 'localOne()' },
        { file: '/workspace/app/src/recipes.ts', bundle: 'localTwo()' },
      ],
    })

    const result = await prepareBaseFragments('/workspace/app', {
      include: ['src/**/*.{ts,tsx}'],
      extends: [
        { name: 'upstream-one', fragment: 'upstreamOne()' },
        { name: 'empty', fragment: '' },
      ],
    } as never)

    expect(scanForFragments).toHaveBeenCalledWith({
      include: ['src/**/*.{ts,tsx}'],
      importFrom: ['@reference-ui/system', '@reference-ui/core/config', '@reference-ui/cli/config'],
      cwd: '/workspace/app',
    })
    expect(bundleFragments).toHaveBeenCalledWith({
      files: ['/workspace/app/src/theme.ts', '/workspace/app/src/recipes.ts'],
      alias: {
        '@reference-ui/system': '/workspace/core/src/entry/system.ts',
        '@reference-ui/core/config': '/workspace/core/src/entry/system.ts',
        '@reference-ui/cli/config': '/workspace/core/src/entry/system.ts',
        '@reference-ui/react': '/workspace/core/src/entry/react.ts',
        '@reference-ui/styled/css': '/workspace/core/src/system/styled/css/index.js',
        '@reference-ui/styled/css/cva': '/workspace/core/src/system/styled/css/cva.js',
        '@reference-ui/styled/jsx': '/workspace/core/src/system/styled/jsx/index.js',
        '@reference-ui/styled/patterns/box': '/workspace/core/src/system/styled/patterns/box.js',
      },
    })
    expect(result).toEqual({
      upstreamFragments: ['upstreamOne()'],
      localFragmentBundles: [
        { file: '/workspace/app/src/theme.ts', bundle: 'localOne()' },
        { file: '/workspace/app/src/recipes.ts', bundle: 'localTwo()' },
      ],
    })
  })

  it('builds collector runtime that suppresses upstream globalCss and restores local globalCss', async () => {
    const {
      createCollectorBundleFromBase,
      bundleFragments,
      resolveInternalPatternFiles,
    } = await importFragmentsModule({
      internalPatternFiles: [
        '/workspace/core/src/system/panda/config/extensions/container/container.ts',
        '/workspace/core/src/system/panda/config/extensions/r/r.ts',
        '/workspace/core/src/system/panda/config/extensions/size/size.ts',
      ],
      bundledFragments: [
        { file: '/workspace/core/src/system/panda/config/extensions/container/container.ts', bundle: 'internalContainer()' },
        { file: '/workspace/core/src/system/panda/config/extensions/r/r.ts', bundle: 'internalR()' },
        { file: '/workspace/core/src/system/panda/config/extensions/size/size.ts', bundle: 'internalSize()' },
      ],
    })

    const result = await createCollectorBundleFromBase('/workspace/app', {
      upstreamFragments: ['upstreamOne()', 'upstreamTwo()'],
      localFragmentBundles: [
        { file: '/workspace/app/src/theme.ts', bundle: 'localOne()' },
        { file: '/workspace/app/src/recipes.ts', bundle: 'localTwo()' },
      ],
    })

    expect(resolveInternalPatternFiles).toHaveBeenCalledWith('/workspace/core')
    expect(bundleFragments).toHaveBeenCalledWith({
      files: [
        '/workspace/core/src/system/panda/config/extensions/container/container.ts',
        '/workspace/core/src/system/panda/config/extensions/r/r.ts',
        '/workspace/core/src/system/panda/config/extensions/size/size.ts',
      ],
      alias: {
        '@reference-ui/system': '/workspace/core/src/entry/system.ts',
        '@reference-ui/core/config': '/workspace/core/src/entry/system.ts',
        '@reference-ui/cli/config': '/workspace/core/src/entry/system.ts',
        '@reference-ui/react': '/workspace/core/src/entry/react.ts',
        '@reference-ui/styled/css': '/workspace/core/src/system/styled/css/index.js',
        '@reference-ui/styled/css/cva': '/workspace/core/src/system/styled/css/cva.js',
        '@reference-ui/styled/jsx': '/workspace/core/src/system/styled/jsx/index.js',
        '@reference-ui/styled/patterns/box': '/workspace/core/src/system/styled/patterns/box.js',
      },
    })
    expect(result.collectorFragments).toContain("globalThis['__refGlobalCssCollector'] = undefined")
    expect(result.collectorFragments).toContain(';upstreamOne()')
    expect(result.collectorFragments).toContain(';upstreamTwo()')
    expect(result.collectorFragments).toContain("globalThis['__refGlobalCssCollector'] = []")
    expect(result.collectorFragments).toContain(';localOne()')
    expect(result.collectorFragments).toContain(';localTwo()')
    expect(result.collectorFragments).toContain(';internalContainer()')
    expect(result.collectorFragments).toContain(';internalR()')
    expect(result.collectorFragments).toContain(';internalSize()')
    expect(result.getValue('globalCss')).toContain("globalThis['__refGlobalCssCollector']")
  })

  it('creates a portable fragment bundle in stable upstream-then-local order', async () => {
    const { createPortableBaseFragmentBundle } = await importFragmentsModule()

    expect(
      createPortableBaseFragmentBundle({
        upstreamFragments: ['upstreamOne()', 'upstreamTwo()'],
        localFragmentBundles: [
          { file: '/workspace/app/src/theme.ts', bundle: 'localOne()' },
          { file: '/workspace/app/src/recipes.ts', bundle: 'localTwo()' },
        ],
      })
    ).toBe(';upstreamOne()\n;upstreamTwo()\n;localOne()\n;localTwo()')
  })
})