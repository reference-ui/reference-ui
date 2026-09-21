// Unit tests for the Neo fragment prepare flow over mocked scan and bundle.
// They take fake file lists and assert upstream filtering, prepare output,
// plus merge-time private scoping over source-tagged token fragments.
// This file adapts the core base fragments tests minus config templating.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { join } from 'node:path'
import { CONFIG_FRAGMENT_SOURCE_PROPERTY } from '../lib/types.ts'
import { UPSTREAM_FRAGMENT_SOURCE, scopeUpstreamTokenFragment } from './index.ts'

async function importFragmentsModule(options?: {
  scannedFiles?: string[]
  scannedSources?: Array<{ path: string; content: string }>
  bundledFragments?: Array<{ file: string; bundle: string }>
}) {
  vi.resetModules()

  const matches = options?.scannedFiles ?? ['/workspace/app/src/theme.ts']
  const scannedSources = options?.scannedSources ?? []
  const scanFragmentSources = vi.fn(async () => ({ matches, scannedSources }))
  const bundleFragments = vi.fn(async () =>
    options?.bundledFragments ?? [{ file: '/workspace/app/src/theme.ts', bundle: 'localOne()' }]
  )

  vi.doMock('../lib/index.ts', () => ({
    scanFragmentSources,
    bundleFragments,
    CONFIG_FRAGMENT_SOURCE_PROPERTY: '__refConfigFragmentSource',
  }))

  const mod = await import('./index.ts')
  return {
    ...mod,
    scanFragmentSources,
    bundleFragments,
  }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../lib/index.ts')
  vi.restoreAllMocks()
})

function tagSource(fragment: Record<string, unknown>, source: string): Record<string, unknown> {
  Object.defineProperty(fragment, CONFIG_FRAGMENT_SOURCE_PROPERTY, {
    configurable: true,
    enumerable: false,
    value: source,
  })
  return fragment
}

function upstreamTokens(): Record<string, unknown> {
  return {
    colors: {
      up: { value: '#ffffff' },
      _private: { upstreamSecret: { value: '#999999' } },
    },
    _private: { vault: { value: '#123456' } },
  }
}

describe('scopeUpstreamTokenFragment', () => {
  const names = ['upstream-one', 'upstream-two']

  it.each([['upstream-one'], ['upstream-two']])(
    'strips _private from fragments tagged with the upstream name %s',
    source => {
      expect(scopeUpstreamTokenFragment(tagSource(upstreamTokens(), source), names)).toEqual({
        colors: { up: { value: '#ffffff' } },
      })
    }
  )

  it('strips fragments tagged with the unnamed-upstream fallback literal', () => {
    expect(
      scopeUpstreamTokenFragment(tagSource(upstreamTokens(), UPSTREAM_FRAGMENT_SOURCE), names)
    ).toEqual({ colors: { up: { value: '#ffffff' } } })
  })

  it('passes local fragments through untouched by reference', () => {
    const local = tagSource(
      { colors: { own: { value: '#222222' }, _private: { ownSecret: { value: '#ff00ff' } } } },
      'theme/tokens.ts'
    )

    expect(scopeUpstreamTokenFragment(local, names)).toBe(local)
  })

  it('passes untagged and non-object fragments through', () => {
    const untagged = { colors: { up: { value: '#ffffff' } } }

    expect(scopeUpstreamTokenFragment(untagged, names)).toBe(untagged)
    expect(scopeUpstreamTokenFragment('tokens()', names)).toBe('tokens()')
    expect(scopeUpstreamTokenFragment(undefined, names)).toBe(undefined)
  })

  it('keeps the non-enumerable source tag on the stripped copy', () => {
    const stripped = scopeUpstreamTokenFragment(
      tagSource(upstreamTokens(), 'upstream-one'),
      names
    ) as Record<string, unknown>

    expect(stripped[CONFIG_FRAGMENT_SOURCE_PROPERTY]).toBe('upstream-one')
    expect(Object.keys(stripped)).not.toContain(CONFIG_FRAGMENT_SOURCE_PROPERTY)
  })
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
    const scannedSources = [
      { path: '/workspace/app/src/theme.ts', content: 'tokens()' },
      { path: '/workspace/app/src/recipes.ts', content: 'recipe()' },
    ]
    const {
      prepareFragments,
      scanFragmentSources,
      bundleFragments,
    } = await importFragmentsModule({
      scannedFiles: ['/workspace/app/src/theme.ts', '/workspace/app/src/recipes.ts'],
      scannedSources,
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

    expect(scanFragmentSources).toHaveBeenCalledWith({
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
      scannedSources,
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
        scannedSources: [],
      })
    ).toBe(';upstreamOne()\n;upstreamTwo()\n;localOne()\n;localTwo()')
  })
})
