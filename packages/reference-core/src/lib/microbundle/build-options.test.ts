import { describe, expect, it } from 'vitest'
import { buildMicroBundleOptions } from './build-options'
import { DEFAULT_EXTERNALS } from './externals'

const ENTRY_PATH = '/Users/reference-ui/tests/entry.ts'
const SYSTEM_ENTRY_PATH = '/Users/reference-ui/tests/system.ts'

describe('buildMicroBundleOptions', () => {
  it('uses the expected defaults', () => {
    const result = buildMicroBundleOptions(ENTRY_PATH, {})

    expect(result).toMatchObject({
      entryPoints: [ENTRY_PATH],
      bundle: true,
      format: 'esm',
      platform: 'node',
      target: 'node18',
      write: false,
      external: DEFAULT_EXTERNALS,
      minify: false,
      keepNames: true,
      treeShaking: true,
      splitting: false,
      mainFields: ['module', 'main'],
      conditions: ['import', 'node'],
    })
    expect(result.plugins).toEqual([])
  })

  it('applies explicit overrides', () => {
    const result = buildMicroBundleOptions(ENTRY_PATH, {
      format: 'cjs',
      platform: 'browser',
      target: ['es2020'],
      external: ['foo'],
      minify: true,
      keepNames: false,
      treeShaking: false,
      mainFields: ['main'],
      conditions: ['browser'],
      alias: {
        '@reference-ui/system': SYSTEM_ENTRY_PATH,
      },
    })

    expect(result).toMatchObject({
      format: 'cjs',
      platform: 'browser',
      target: ['es2020'],
      external: ['foo'],
      minify: true,
      keepNames: false,
      treeShaking: false,
      mainFields: ['main'],
      conditions: ['browser'],
    })
    expect(result.plugins).toHaveLength(1)
  })

  it('filters non-string externals out of the esbuild config', () => {
    const result = buildMicroBundleOptions(ENTRY_PATH, {
      external: ['foo', 123 as never, /bar/ as never],
    })

    expect(result.external).toEqual(['foo'])
  })

  it('supports iife output format for runtime bundles', () => {
    const result = buildMicroBundleOptions(ENTRY_PATH, {
      format: 'iife',
    })

    expect(result.format).toBe('iife')
  })

  it('forwards tsconfigRaw overrides', () => {
    const result = buildMicroBundleOptions(ENTRY_PATH, {
      tsconfigRaw: {
        compilerOptions: {},
      },
    })

    expect(result.tsconfigRaw).toEqual({
      compilerOptions: {},
    })
  })
})
