// Unit tests for the Neo fragment prepare flow over mocked scan and bundle.
// They take fake file lists and assert upstream filtering plus prepare output.
// This file adapts the core base fragments tests minus config templating.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { join } from 'node:path'

async function importFragmentsModule(options?: {
  scannedFiles?: string[]
  bundledFragments?: Array<{ file: string; bundle: string }>
}) {
  vi.resetModules()

  const scanForFragments = vi.fn(() => options?.scannedFiles ?? ['/workspace/app/src/theme.ts'])
  const bundleFragments = vi.fn(async () =>
    options?.bundledFragments ?? [{ file: '/workspace/app/src/theme.ts', bundle: 'localOne()' }]
  )

  vi.doMock('../lib/index.ts', () => ({
    scanForFragments,
    bundleFragments,
    CONFIG_FRAGMENT_SOURCE_PROPERTY: '__refConfigFragmentSource',
  }))

  const mod = await import('./index.ts')
  return {
    ...mod,
    scanForFragments,
    bundleFragments,
  }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../lib/index.ts')
  vi.restoreAllMocks()
})

describe('fragments prepare flow', () => {
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

  it('maps bootstrap fragment imports back to the Neo author entry', async () => {
    await importFragmentsModule()
    const { getFragmentBootstrapImportMap } = await import('./bootstrap-import-map.ts')

    const authorEntry = join(import.meta.dirname, '..', '..', 'author', 'index.ts')
    expect(getFragmentBootstrapImportMap()).toEqual({
      '@reference-ui/neo': authorEntry,
      '@reference-ui/neo/config': authorEntry,
      '@reference-ui/system': authorEntry,
      '@reference-ui/core/config': authorEntry,
      '@reference-ui/cli/config': authorEntry,
    })
  })

})

describe('fragments prepare output', () => {
  it('prepares fragments from scanned files and bundled local fragments', async () => {
    const {
      prepareFragments,
      scanForFragments,
      bundleFragments,
    } = await importFragmentsModule({
      scannedFiles: ['/workspace/app/src/theme.ts', '/workspace/app/src/recipes.ts'],
      bundledFragments: [
        { file: '/workspace/app/src/theme.ts', bundle: 'localOne()' },
        { file: '/workspace/app/src/recipes.ts', bundle: 'localTwo()' },
      ],
    })
    const { getFragmentBootstrapImportMap } = await import('./bootstrap-import-map.ts')

    const result = await prepareFragments('/workspace/app', {
      name: 'app-system',
      include: ['src/**/*.{ts,tsx}'],
      extends: [
        { name: 'upstream-one', fragment: 'upstreamOne()' },
        { name: 'empty', fragment: '' },
      ],
    })

    expect(scanForFragments).toHaveBeenCalledWith({
      include: ['src/**/*.{ts,tsx}'],
      importFrom: [
        '@reference-ui/neo',
        '@reference-ui/neo/config',
        '@reference-ui/system',
        '@reference-ui/core/config',
        '@reference-ui/cli/config',
      ],
      cwd: '/workspace/app',
    })
    expect(bundleFragments).toHaveBeenCalledWith({
      files: ['/workspace/app/src/theme.ts', '/workspace/app/src/recipes.ts'],
      alias: getFragmentBootstrapImportMap(),
    })
    expect(result).toEqual({
      upstreamFragments: ['upstreamOne()'],
      localFragmentBundles: [
        { file: '/workspace/app/src/theme.ts', bundle: 'localOne()' },
        { file: '/workspace/app/src/recipes.ts', bundle: 'localTwo()' },
      ],
    })
  })

  it('creates a portable fragment bundle in stable upstream-then-local order', async () => {
    const { createPortableFragmentBundle } = await importFragmentsModule()

    expect(
      createPortableFragmentBundle({
        upstreamFragments: ['upstreamOne()', 'upstreamTwo()'],
        localFragmentBundles: [
          { file: '/workspace/app/src/theme.ts', bundle: 'localOne()' },
          { file: '/workspace/app/src/recipes.ts', bundle: 'localTwo()' },
        ],
      })
    ).toBe(';upstreamOne()\n;upstreamTwo()\n;localOne()\n;localTwo()')
  })
})
