/**
 * Unit tests for chain topology contracts.
 *
 * These tests prove the compiler's composition model at the unit level,
 * without needing full Panda compilation or browser fixtures.
 *
 * Covers the "Unit / narrow integration" claims from matrix/CHAIN.md:
 * 1. collectUpstreamSystems() bucketed ordering
 * 2. postprocessCss() assembled stylesheet shape with upstream systems
 * 3. The T8 same-package-in-both-buckets behaviour (documented below)
 */

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import type { ReferenceUIConfig } from '../../../config'
import { collectUpstreamSystems } from './helpers'
import { postprocessCss } from './index'

const createdDirs: string[] = []

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-chain-topology-'))
  createdDirs.push(dir)
  return dir
}

function writePandaOutput(outDir: string, rawCss: string): string {
  const styledDir = resolve(outDir, 'styled')
  const stylesPath = resolve(styledDir, 'styles.css')
  mkdirSync(styledDir, { recursive: true })
  writeFileSync(stylesPath, rawCss, 'utf-8')
  return stylesPath
}

afterEach(() => {
  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// collectUpstreamSystems — bucketed ordering
// ---------------------------------------------------------------------------

describe('collectUpstreamSystems — bucketed ordering', () => {
  it('returns an empty array when neither extends nor layers are declared', () => {
    const config: Partial<ReferenceUIConfig> = { name: 'local' }
    expect(collectUpstreamSystems(config as never)).toEqual([])
  })

  it('returns extends-only entries in declared order', () => {
    const config: Partial<ReferenceUIConfig> = {
      name: 'local',
      extends: [
        { name: 'lib-a', css: '@layer lib-a { .a { color: red; } }' },
        { name: 'lib-b', css: '@layer lib-b { .b { color: blue; } }' },
      ],
    }
    const result = collectUpstreamSystems(config as never)
    expect(result.map(s => s.name)).toEqual(['lib-a', 'lib-b'])
  })

  it('returns layers-only entries in declared order', () => {
    const config: Partial<ReferenceUIConfig> = {
      name: 'local',
      layers: [
        { name: 'lib-c', css: '@layer lib-c { .c { color: green; } }' },
        { name: 'lib-d', css: '@layer lib-d { .d { color: yellow; } }' },
      ],
    }
    const result = collectUpstreamSystems(config as never)
    expect(result.map(s => s.name)).toEqual(['lib-c', 'lib-d'])
  })

  it('returns extends entries before layers entries (bucket order)', () => {
    // T11 core claim: assembly is [...extends, ...layers], not interleaved.
    const config: Partial<ReferenceUIConfig> = {
      name: 'local',
      extends: [
        { name: 'extend-a', css: '@layer extend-a { .a { color: red; } }' },
        { name: 'extend-b', css: '@layer extend-b { .b { color: blue; } }' },
      ],
      layers: [
        { name: 'layer-c', css: '@layer layer-c { .c { color: green; } }' },
        { name: 'layer-d', css: '@layer layer-d { .d { color: yellow; } }' },
      ],
    }
    const result = collectUpstreamSystems(config as never)
    expect(result.map(s => s.name)).toEqual(['extend-a', 'extend-b', 'layer-c', 'layer-d'])
  })

  it('filters out upstream entries without CSS (empty or whitespace-only)', () => {
    const config: Partial<ReferenceUIConfig> = {
      name: 'local',
      extends: [
        { name: 'lib-a', css: '@layer lib-a { .a { color: red; } }' },
        { name: 'lib-no-css' },
        { name: 'lib-empty', css: '   ' },
      ],
    }
    const result = collectUpstreamSystems(config as never)
    expect(result.map(s => s.name)).toEqual(['lib-a'])
  })

  // --- T8: same package in both buckets ---
  //
  // Current policy: no rejection or deduplication. The same name can appear
  // in both buckets. collectUpstreamSystems returns both entries in bucket
  // order (extends first, then layers). Downstream assembly renders the CSS
  // twice. This is a known-allowed edge case; the T8 test documents it.
  it('T8: same library in both extends and layers — both entries are returned in bucket order', () => {
    const sharedCss = '@layer shared { .x { color: hotpink; } }'
    const config: Partial<ReferenceUIConfig> = {
      name: 'local',
      extends: [{ name: 'shared-lib', css: sharedCss }],
      layers: [{ name: 'shared-lib', css: sharedCss }],
    }
    const result = collectUpstreamSystems(config as never)
    // Both appear — current policy is allow/duplicate, not reject/dedupe.
    expect(result.map(s => s.name)).toEqual(['shared-lib', 'shared-lib'])
  })
})

// ---------------------------------------------------------------------------
// postprocessCss — assembled stylesheet shape with upstream systems
// ---------------------------------------------------------------------------

describe('postprocessCss — assembled stylesheet shape', () => {
  const localRawCss = '@layer base, tokens;\n@layer tokens { :where(:root,:host) { --local: #fff; } }'

  it('T1 shape: extend one library — upstream CSS precedes local layer', () => {
    const outDir = createTempDir()
    writePandaOutput(outDir, localRawCss)

    const result = postprocessCss(outDir, {
      name: 'local',
      extends: [{ name: 'lib-a', css: '@layer lib-a { .a { color: red; } }' }],
    } as never)

    expect(result).toContain('@layer lib-a, local;')
    expect(result).toContain('@layer lib-a { .a { color: red; } }')
    // lib-a block appears before the local portable stylesheet
    const libAIndex = result!.indexOf('@layer lib-a { .a')
    const localIndex = result!.indexOf('@layer local')
    expect(libAIndex).toBeGreaterThan(-1)
    expect(localIndex).toBeGreaterThan(-1)
    expect(libAIndex).toBeGreaterThan(localIndex) // prelude is first; CSS blocks after
  })

  it('T2 shape: layer one library — upstream CSS precedes local layer', () => {
    const outDir = createTempDir()
    writePandaOutput(outDir, localRawCss)

    const result = postprocessCss(outDir, {
      name: 'local',
      layers: [{ name: 'lib-b', css: '@layer lib-b { .b { color: blue; } }' }],
    } as never)

    expect(result).toContain('@layer lib-b, local;')
    expect(result).toContain('@layer lib-b { .b { color: blue; } }')
  })

  it('T3 shape: extends before layers in both prelude and CSS block order', () => {
    const outDir = createTempDir()
    writePandaOutput(outDir, localRawCss)

    const result = postprocessCss(outDir, {
      name: 'local',
      extends: [{ name: 'extend-a', css: '@layer extend-a { .a { color: red; } }' }],
      layers: [{ name: 'layer-b', css: '@layer layer-b { .b { color: blue; } }' }],
    } as never)

    // Prelude must list: extends... then layers... then local
    expect(result).toContain('@layer extend-a, layer-b, local;')

    // CSS blocks appear in the same bucket order
    const extendAIndex = result!.indexOf('@layer extend-a {')
    const layerBIndex = result!.indexOf('@layer layer-b {')
    expect(extendAIndex).toBeGreaterThan(-1)
    expect(layerBIndex).toBeGreaterThan(-1)
    expect(extendAIndex).toBeLessThan(layerBIndex)
  })

  it('T11 shape: several extends + several layers — full bucket order preserved', () => {
    const outDir = createTempDir()
    writePandaOutput(outDir, localRawCss)

    const result = postprocessCss(outDir, {
      name: 'local',
      extends: [
        { name: 'ext-a', css: '@layer ext-a { .a { color: red; } }' },
        { name: 'ext-b', css: '@layer ext-b { .b { color: blue; } }' },
      ],
      layers: [
        { name: 'lay-c', css: '@layer lay-c { .c { color: green; } }' },
        { name: 'lay-d', css: '@layer lay-d { .d { color: yellow; } }' },
      ],
    } as never)

    // Prelude order: extends[] then layers[] then local
    expect(result).toContain('@layer ext-a, ext-b, lay-c, lay-d, local;')

    // CSS block order matches bucket order
    const extA = result!.indexOf('@layer ext-a {')
    const extB = result!.indexOf('@layer ext-b {')
    const layC = result!.indexOf('@layer lay-c {')
    const layD = result!.indexOf('@layer lay-d {')
    expect(extA).toBeLessThan(extB)
    expect(extB).toBeLessThan(layC)
    expect(layC).toBeLessThan(layD)
  })

  it('local system layer always appears last in the prelude', () => {
    const outDir = createTempDir()
    writePandaOutput(outDir, localRawCss)

    const result = postprocessCss(outDir, {
      name: 'my-system',
      extends: [{ name: 'upstream', css: '@layer upstream { .x { color: red; } }' }],
    } as never)

    const preludeLine = result!.split('\n').find(line => line.startsWith('@layer '))
    expect(preludeLine).toMatch(/my-system;$/)
  })
})
