// Native-scan lifecycle battery (F1 §6.8 tests 10-13 plus harness extras).
// It takes temp trees and asserts token release, fail-loud errors, the
// exactly-one-of rejection, retain:false parity, the TS escape hatch, and the
// functional backfill proof: retained bytes survive disk mutation while the
// kept walk still backfills what the list misses.

import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { scanForFragments } from '../lib/scanner.ts'
import { scanForFragmentsNative, scanFragmentSourcesNative } from '../lib/scanner-native.ts'
import {
  CSS_RED,
  NEEDLES,
  NEO_IMPORT,
  atomic,
  libSystemSpec,
  platformSep,
  withTree,
} from './scan-native-helpers.ts'

// Beyond any minted token in a test process (monotonic from 1, JSON-safe).
const NEVER_MINTED = Number.MAX_SAFE_INTEGER - 7

describe('native scan lifecycle', () => {
  it('(10) release-on-error empties the store, idempotent', async () => {
    await withTree('f1-release', [['src/a.ts', CSS_RED]], async root => {
      const mod = await atomic()
      const res = await mod.scan({
        paths: [join(root, 'src/a.ts')],
        needles: [],
        cwd: root,
        sep: platformSep(),
      })
      const token = res.retentionToken as number
      expect(token).toBeDefined()
      expect(await mod.releaseScan({ retentionToken: token })).toEqual({ released: true })
      expect(await mod.releaseScan({ retentionToken: token })).toEqual({ released: false })
      expect(await mod.releaseScan({ retentionToken: NEVER_MINTED })).toEqual({ released: false })
      // Released bytes are gone: the compile errors, never falls back.
      const rejected = await mod.compile({
        baseSystem: libSystemSpec(),
        rootDir: root,
        retentionToken: token,
        logs: ['proof'],
      })
      expect(rejected.diagnostics.length).toBe(1)
      expect(rejected.diagnostics[0]?.code).toBe('ATM-E-UNKNOWN-RETENTION-TOKEN')
      expect(rejected.wants ?? []).toEqual([])
    })
  })

  it('(11) unknown tokens error loudly, never silently scan disk', async () => {
    await withTree('f1-unknown', [['src/a.ts', CSS_RED]], async root => {
      const mod = await atomic()
      const baseSystem = libSystemSpec()
      const rejected = await mod.compile({
        baseSystem,
        rootDir: root,
        retentionToken: NEVER_MINTED,
        logs: ['proof'],
      })
      expect(rejected.diagnostics.length).toBe(1)
      expect(rejected.diagnostics[0]?.severity).toBe('error')
      expect(rejected.diagnostics[0]?.code).toBe('ATM-E-UNKNOWN-RETENTION-TOKEN')
      // The disk holds a red want; the rejection holds none: no fallback ran.
      expect(rejected.wants ?? []).toEqual([])
      expect(rejected.stylesheet.startsWith('@layer')).toBe(true)
      expect(rejected.stylesheet).toBe(rejected.portableStylesheet)
      const fromDisk = await mod.compile({ baseSystem, rootDir: root, logs: ['proof'] })
      expect((fromDisk.wants ?? []).length).toBeGreaterThan(0)
    })
  })

  it('(12) files-plus-token rejects before the drain consumes it', async () => {
    await withTree('f1-conflict', [['src/a.ts', CSS_RED]], async root => {
      const mod = await atomic()
      const path = join(root, 'src/a.ts')
      const res = await mod.scan({ paths: [path], needles: [], cwd: root, sep: platformSep() })
      const token = res.retentionToken as number
      const baseSystem = libSystemSpec()
      const rejected = await mod.compile({
        baseSystem,
        rootDir: root,
        files: [{ path, content: CSS_RED }],
        retentionToken: token,
        logs: ['proof'],
      })
      expect(rejected.diagnostics.length).toBe(1)
      expect(rejected.diagnostics[0]?.code).toBe('ATM-E-CONFLICTING-SCAN-INPUTS')
      // The rejection precedes the drain: the token still compiles after.
      const drained = await mod.compile({
        baseSystem,
        rootDir: root,
        retentionToken: token,
        logs: ['proof'],
      })
      expect(drained.diagnostics).toEqual([])
      expect((drained.wants ?? []).map(want => want.prop)).toEqual(['color'])
    })
  })

})

describe('native scan retain modes', () => {
  it('(13) retain:false matches the planner with no token and no leak', async () => {
    const files: Array<[string, string]> = [
      ['src/tokens.ts', `tokens({ colors: { brand: { value: '#7c3aed' } } })\n`],
      ['src/plain.ts', 'export const x = 1\n'],
      ['src/frag.ts', NEO_IMPORT],
    ]
    await withTree('f1-planner', files, async root => {
      // Planner discovery (function names, no importFrom) agrees exactly.
      const plannerOptions = { include: ['**/*'], functionNames: ['tokens', 'recipe'], cwd: root }
      expect(await scanForFragmentsNative(plannerOptions)).toEqual(
        await scanForFragments(plannerOptions)
      )
      expect(await scanForFragments(plannerOptions)).toEqual([join(root, 'src/tokens.ts')])
      // Import discovery agrees exactly too.
      const importOptions = { include: ['**/*'], importFrom: NEEDLES, cwd: root }
      expect(await scanForFragmentsNative(importOptions)).toEqual(
        await scanForFragments(importOptions)
      )
      // Direct retain:false: matches return, nothing retains, no token mints.
      const mod = await atomic()
      const res = await mod.scan({
        paths: [join(root, 'src/tokens.ts'), join(root, 'src/frag.ts')],
        needles: ['tokens', '@reference-ui/neo'],
        cwd: root,
        sep: platformSep(),
        retain: false,
        manifest: true,
      })
      expect(res.hits.length).toBe(2)
      expect(res.retainedCount).toBe(0)
      expect(res.retentionToken).toBeUndefined()
      expect(res.manifest).toEqual([])
    })
  })

  it('(X1) the TS hatch forces the fallback bytes path', async () => {
    await withTree('f1-hatch', [['src/a.ts', NEO_IMPORT]], async root => {
      const options = { include: ['**/*'], importFrom: NEEDLES, cwd: root }
      const previous = process.env['REFERENCE_UI_SCAN_NATIVE']
      process.env['REFERENCE_UI_SCAN_NATIVE'] = '0'
      try {
        const native = await scanFragmentSourcesNative(options)
        expect(native.retention.token).toBeUndefined()
        expect(native.retention.files?.length).toBe(1)
        const { scanFragmentSources } = await import('../lib/scanner.ts')
        expect(native.matches).toEqual((await scanFragmentSources(options)).matches)
      } finally {
        if (previous === undefined) delete process.env['REFERENCE_UI_SCAN_NATIVE']
        else process.env['REFERENCE_UI_SCAN_NATIVE'] = previous
      }
    })
  })

})

describe('native scan backfill proof', () => {
  it('(X3) retained bytes survive disk mutation; the walk still backfills', async () => {
    const blue = CSS_RED.replace("'red'", "'blue'")
    const green = CSS_RED.replace("'red'", "'green'")
    await withTree(
      'f1-mutate',
      [
        ['src/a.ts', CSS_RED],
        ['src/b.ts', blue],
      ],
      async root => {
        const mod = await atomic()
        const baseSystem = libSystemSpec()
        const paths = [join(root, 'src/a.ts'), join(root, 'src/b.ts')]
        const res = await mod.scan({ paths, needles: [], cwd: root, sep: platformSep() })
        const token = res.retentionToken as number
        // Mutate the disk AFTER the scan: rewrite one file, delete another.
        writeFileSync(join(root, 'src/a.ts'), green)
        rmSync(join(root, 'src/b.ts'), { force: true })
        // The drain serves the retained (pre-mutation) bytes: the backfill
        // walk reads zero for listed paths, so neither change is visible.
        const held = await mod.compile({
          baseSystem,
          rootDir: root,
          retentionToken: token,
          logs: ['proof'],
        })
        const heldColors = (held.wants ?? [])
          .filter(want => want.prop === 'color')
          .map(want => (want.value as { String?: string }).String ?? '')
          .sort()
        expect(heldColors).toEqual(['blue', 'red'])
        // Control: a fresh scan sees the mutated disk (the test is not vacuous).
        const fresh = await mod.scan({ paths, needles: [], cwd: root, sep: platformSep() })
        const relived = await mod.compile({
          baseSystem,
          rootDir: root,
          retentionToken: fresh.retentionToken as number,
          logs: ['proof'],
        })
        const relivedColors = (relived.wants ?? [])
          .filter(want => want.prop === 'color')
          .map(want => (want.value as { String?: string }).String ?? '')
          .sort()
        expect(relivedColors).toEqual(['green'])
      }
    )
    await withTree(
      'f1-backfill',
      [
        ['src/c.ts', CSS_RED],
        ['src/d.ts', blue],
      ],
      async root => {
        // Positive control: a partial retention backfills the missing file
        // from disk, proving the union walk is kept, not deleted.
        const mod = await atomic()
        const res = await mod.scan({
          paths: [join(root, 'src/c.ts')],
          needles: [],
          cwd: root,
          sep: platformSep(),
        })
        const backfilled = await mod.compile({
          baseSystem: libSystemSpec(),
          rootDir: root,
          retentionToken: res.retentionToken as number,
          logs: ['proof'],
        })
        const colors = (backfilled.wants ?? [])
          .filter(want => want.prop === 'color')
          .map(want => (want.value as { String?: string }).String ?? '')
          .sort()
        expect(colors).toEqual(['blue', 'red'])
      }
    )
  })
})
