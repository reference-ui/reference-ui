// Walk-completeness end-to-end battery: the skipped backfill walk proves out.
// It takes temp trees plus the real native scan and asserts skip-vs-walk byte
// identity on a tricky tree, coherent-snapshot race semantics (a file created
// after a complete scan stays invisible while the kept walk still finds it),
// the extglob fallback the flag must never claim, scope/root mismatch walks,
// and the empty, single-file, and all-dead edges.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { scanFragmentSourcesNative } from '../lib/scanner-native.ts'
import {
  CSS_RED,
  NEEDLES,
  TRICKY_TREE,
  atomic,
  enumerateCandidates,
  libSystemSpec,
  platformSep,
  withTree,
  type TestCompileResult,
} from './scan-native-helpers.ts'

const BLUE = CSS_RED.replace("'red'", "'blue'")

// Sorted color wants for set comparisons (proof channel carries the rows).
function colorWants(result: TestCompileResult): string[] {
  return (result.wants ?? [])
    .filter(want => want.prop === 'color')
    .map(want => (want.value as { String?: string }).String ?? '')
    .sort()
}

// Full compile artifact as one comparable string: sheets, runtime, wants,
// and diagnostics must all agree between the skip and walk arms.
function artifactOf(result: TestCompileResult): string {
  return JSON.stringify({
    stylesheet: result.stylesheet,
    portableStylesheet: result.portableStylesheet,
    runtime: result.runtime,
    wants: result.wants,
    diagnostics: result.diagnostics,
  })
}

// Skip arm: the real native scan asserts completeness, then compile drains.
async function compileSkipArm(root: string, include: string[]): Promise<TestCompileResult> {
  const mod = await atomic()
  const native = await scanFragmentSourcesNative({ include, importFrom: NEEDLES, cwd: root })
  return mod.compile({
    baseSystem: libSystemSpec(),
    rootDir: root,
    retentionToken: native.retention.token as number,
    include,
    logs: ['proof'],
  })
}

// Walk arm: the same enumeration with the flag withheld, so the union walk
// runs and proves what the skip must equal.
async function compileWalkArm(root: string, include: string[]): Promise<TestCompileResult> {
  const mod = await atomic()
  const candidates = enumerateCandidates(root, include)
  const walked = await mod.scan({
    paths: candidates,
    needles: NEEDLES,
    cwd: root,
    sep: platformSep(),
  })
  return mod.compile({
    baseSystem: libSystemSpec(),
    rootDir: root,
    retentionToken: walked.retentionToken as number,
    include,
    logs: ['proof'],
  })
}

describe('walk-completeness skip identity', () => {
  it('skip and walk arms agree byte-for-byte on the tricky tree', async () => {
    await withTree('walk-ident', TRICKY_TREE, async root => {
      const include = ['**/*.ts']
      const skipped = await compileSkipArm(root, include)
      const walked = await compileWalkArm(root, include)
      expect(artifactOf(skipped)).toEqual(artifactOf(walked))
      expect(colorWants(skipped).length).toBeGreaterThan(0)
    })
  })

  it('a file created after a complete scan stays invisible; the kept walk finds it', async () => {
    await withTree('walk-race', [['src/a.ts', CSS_RED]], async root => {
      const mod = await atomic()
      const baseSystem = libSystemSpec()
      const include = ['src/**/*.ts']
      const complete = await scanFragmentSourcesNative({
        include,
        importFrom: NEEDLES,
        cwd: root,
      })
      const candidates = enumerateCandidates(root, include)
      const partial = await mod.scan({
        paths: candidates,
        needles: NEEDLES,
        cwd: root,
        sep: platformSep(),
        walkComplete: false,
        include,
      })
      // Created after both scans: the skip holds the scan-time snapshot while
      // the walk arm still union-fills from disk.
      writeFileSync(join(root, 'src/late.ts'), CSS_RED.replace("'red'", "'latecolor'"))
      const skipped = await mod.compile({
        baseSystem,
        rootDir: root,
        retentionToken: complete.retention.token as number,
        include,
        logs: ['proof'],
      })
      const walked = await mod.compile({
        baseSystem,
        rootDir: root,
        retentionToken: partial.retentionToken as number,
        include,
        logs: ['proof'],
      })
      expect(colorWants(skipped)).toEqual(['red'])
      expect(colorWants(walked)).toEqual(['latecolor', 'red'])
    })
  })

})

describe('walk-completeness kept walks', () => {
  it('an extglob scope keeps the walk and finds the literal file', async () => {
    await withTree(
      'walk-exotic',
      [
        ['src/ab.ts', CSS_RED],
        ['src/a+(b).ts', BLUE],
      ],
      async root => {
        const mod = await atomic()
        // fg reads the extglob (ab.ts); the native scope reads the literal
        // file only. The check must reject, so the walk finds the literal.
        const include = ['src/a+(b).ts']
        const native = await scanFragmentSourcesNative({
          include,
          importFrom: NEEDLES,
          cwd: root,
        })
        const result = await mod.compile({
          baseSystem: libSystemSpec(),
          rootDir: root,
          retentionToken: native.retention.token as number,
          include,
          logs: ['proof'],
        })
        expect(colorWants(result)).toEqual(['blue'])
      }
    )
  })

  it('a scope the scan did not cover keeps the walk', async () => {
    await withTree(
      'walk-scope',
      [
        ['src/a.ts', CSS_RED],
        ['theme/t.ts', BLUE],
      ],
      async root => {
        const mod = await atomic()
        const scanned = await mod.scan({
          paths: [join(root, 'src/a.ts')],
          needles: [],
          cwd: root,
          sep: platformSep(),
          walkComplete: true,
          include: ['src/**'],
        })
        const result = await mod.compile({
          baseSystem: libSystemSpec(),
          rootDir: root,
          retentionToken: scanned.retentionToken as number,
          include: ['theme/**'],
          logs: ['proof'],
        })
        expect(colorWants(result)).toEqual(['blue'])
      }
    )
  })

})

describe('walk-completeness root union', () => {
  it('a root the scan did not cover keeps the walk and unions', async () => {
    await withTree('walk-root-x', [['src/a.ts', CSS_RED]], async first => {
      await withTree('walk-root-y', [['src/b.ts', BLUE]], async second => {
        const mod = await atomic()
        const scanned = await mod.scan({
          paths: [join(first, 'src/a.ts')],
          needles: [],
          cwd: first,
          sep: platformSep(),
          walkComplete: true,
          include: [],
        })
        const result = await mod.compile({
          baseSystem: libSystemSpec(),
          rootDir: second,
          retentionToken: scanned.retentionToken as number,
          logs: ['proof'],
        })
        expect(colorWants(result)).toEqual(['blue', 'red'])
      })
    })
  })

})

describe('walk-completeness edges', () => {
  it('an empty root mints no token and compiles empty', async () => {
    await withTree('walk-empty', [], async root => {
      mkdirSync(root, { recursive: true })
      const native = await scanFragmentSourcesNative({
        include: ['src/**/*.ts'],
        importFrom: NEEDLES,
        cwd: root,
      })
      expect(native.retention.token).toBeUndefined()
      const mod = await atomic()
      const result = await mod.compile({
        baseSystem: libSystemSpec(),
        rootDir: root,
        logs: ['proof'],
      })
      expect(result.wants ?? []).toEqual([])
    })
  })

  it('a single file skips byte-identical to the walk', async () => {
    await withTree('walk-single', [['src/a.ts', CSS_RED]], async root => {
      const include = ['src/**/*.ts']
      const skipped = await compileSkipArm(root, include)
      const walked = await compileWalkArm(root, include)
      expect(colorWants(skipped)).toEqual(['red'])
      expect(artifactOf(skipped)).toEqual(artifactOf(walked))
    })
  })

  it('all-dead sources retain yet want nothing', async () => {
    await withTree(
      'walk-dead',
      [
        ['src/a.ts', 'export const x = 1;\n'],
        ['src/b.ts', 'export const y = 2;\n'],
      ],
      async root => {
        const include = ['src/**/*.ts']
        const native = await scanFragmentSourcesNative({
          include,
          importFrom: NEEDLES,
          cwd: root,
        })
        expect(native.retention.token).toBeDefined()
        const skipped = await compileSkipArm(root, include)
        expect(skipped.wants ?? []).toEqual([])
      }
    )
  })
})
