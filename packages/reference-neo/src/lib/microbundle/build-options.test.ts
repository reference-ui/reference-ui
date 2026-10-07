// Unit tests for the Neo build option defaults and overrides.
// They take option bags and assert the esbuild config they produce, pin the
// canonical absWorkingDir, and prove the emitted bytes are cwd-independent.
// This file is a Neo-owned copy of the core build options tests.

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildMicroBundleOptions, NEO_PACKAGE_ROOT } from './build-options.ts'
import { DEFAULT_EXTERNALS } from './externals.ts'
import { microBundleWithResult } from './microbundle.ts'

const ENTRY_PATH = '/Users/reference-ui/tests/entry.ts'
const SYSTEM_ENTRY_PATH = '/Users/reference-ui/tests/system.ts'

describe('buildMicroBundleOptions defaults', () => {
  it('uses the expected defaults', () => {
    const result = buildMicroBundleOptions(ENTRY_PATH, {})

    expect(result).toMatchObject({
      absWorkingDir: NEO_PACKAGE_ROOT,
      entryPoints: [ENTRY_PATH],
      bundle: true,
      format: 'esm',
      platform: 'node',
      target: 'node18',
      write: false,
      external: DEFAULT_EXTERNALS,
      packages: undefined,
      minify: false,
      keepNames: true,
      treeShaking: true,
      splitting: false,
      mainFields: ['module', 'main'],
      conditions: ['import', 'node'],
    })
    expect(result.plugins).toEqual([])
  })
})

describe('buildMicroBundleOptions cwd canon', () => {
  it('pins absWorkingDir to the Neo package root', () => {
    const result = buildMicroBundleOptions(ENTRY_PATH, {})

    expect(result.absWorkingDir).toBe(NEO_PACKAGE_ROOT)
    expect(existsSync(join(NEO_PACKAGE_ROOT, 'package.json'))).toBe(true)
    const manifest = JSON.parse(
      readFileSync(join(NEO_PACKAGE_ROOT, 'package.json'), 'utf8')
    ) as { name?: string }
    expect(manifest.name).toBe('@reference-ui/neo')
  })

  it('ignores process.cwd(): the same entry emits identical bytes from two cwds', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'neo-cwd-canon-'))
    const entry = join(dir, 'entry.ts')
    writeFileSync(entry, "import { helper } from './helper.ts'\nexport const value = helper\n")
    writeFileSync(join(dir, 'helper.ts'), "export const helper = 'canon'\n")

    const originalCwd = process.cwd()
    try {
      process.chdir(dir)
      const fromProjectCwd = await microBundleWithResult(entry, {})
      process.chdir(originalCwd)
      const fromRepoCwd = await microBundleWithResult(entry, {})

      // A real banner is present, so equality is not vacuous.
      expect(fromProjectCwd.code).toContain('// ')
      expect(fromProjectCwd.code).toBe(fromRepoCwd.code)
    } finally {
      process.chdir(originalCwd)
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('buildMicroBundleOptions overrides', () => {
  it('applies explicit overrides', () => {
    const result = buildMicroBundleOptions(ENTRY_PATH, {
      format: 'cjs',
      platform: 'browser',
      target: ['es2020'],
      external: ['foo'],
      packages: 'external',
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
      packages: 'external',
      minify: true,
      keepNames: false,
      treeShaking: false,
      mainFields: ['main'],
      conditions: ['browser'],
    })
    expect(result.plugins).toHaveLength(1)
  })

  it('forwards package externalization to esbuild', () => {
    const result = buildMicroBundleOptions(ENTRY_PATH, {
      packages: 'external',
    })

    expect(result.packages).toBe('external')
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

  it('forwards sourcemap and outfile for external maps', () => {
    const result = buildMicroBundleOptions(ENTRY_PATH, {
      sourcemap: 'linked',
      outfile: '/Users/reference-ui/tests/entry.js',
    })

    expect(result.sourcemap).toBe('linked')
    expect(result.outfile).toBe('/Users/reference-ui/tests/entry.js')
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
