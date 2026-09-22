// Native-scan differential battery (F1 §6.8 tests 1-9): matches, manifest, and
// edge parity between the native and TS scans on tricky trees. Each test takes
// a temp tree and asserts bit-exact reproduction; tokens release before drop.

import { chmodSync, readFileSync, rmSync, symlinkSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import { scanFragmentSources } from '../lib/scanner.ts'
import { scanFragmentSourcesNative } from '../lib/scanner-native.ts'
import {
  CSS_RED,
  NEEDLES,
  NEO_IMPORT,
  TRICKY_MATCHES,
  TRICKY_RETAINED,
  TRICKY_TREE,
  asRelative,
  atomic,
  byteSort,
  enumerateCandidates,
  expectedManifest,
  libSystemSpec,
  makeRoot,
  platformSep,
  releaseToken,
  withTree,
  writeTree,
} from './scan-native-helpers.ts'

describe('native scan matches and manifest', () => {
  it('(1) matches parity on the tricky tree, order-sensitive', async () => {
    await withTree('f1-matches', TRICKY_TREE, async root => {
      const options = { include: ['**/*'], importFrom: NEEDLES, cwd: root }
      const ts = await scanFragmentSources(options)
      const native = await scanFragmentSourcesNative(options)
      try {
        expect(native.matches).toEqual(ts.matches)
        expect(asRelative(root, native.matches)).toEqual([...TRICKY_MATCHES].sort(byteSort))
        expect(native.retention.token).toBeDefined()
        expect(native.retention.count).toBe(ts.scannedSources.length)
        expect(native.retention.files).toBeUndefined()
      } finally {
        await releaseToken(native.retention.token)
      }
    })
  })

  it('(2) manifest parity on the tricky tree, byte-sorted entries', async () => {
    await withTree('f1-manifest', TRICKY_TREE, async root => {
      const candidates = enumerateCandidates(root, ['**/*'])
      const mod = await atomic()
      const res = await mod.scan({
        paths: candidates,
        needles: NEEDLES,
        cwd: root,
        sep: platformSep(),
        manifest: true,
      })
      try {
        const ts = await scanFragmentSources({ include: ['**/*'], importFrom: NEEDLES, cwd: root })
        expect(res.retainedCount).toBe(ts.scannedSources.length)
        expect(asRelative(root, ts.scannedSources.map(source => source.path))).toEqual(
          [...TRICKY_RETAINED].sort(byteSort)
        )
        expect(res.manifest).toEqual(expectedManifest(root, ts.scannedSources))
      } finally {
        await releaseToken(res.retentionToken)
      }
    })
  })

})

describe('native scan byte edges', () => {
  it('(3) M1e invalid-UTF-8 battery reads identically both sides', async () => {
    const FFFD = '\u{FFFD}'
    const vectors: Array<[string, Buffer, string]> = [
      ['overlong', Buffer.from([0x41, 0xc0, 0xaf, 0x42]), `A${FFFD}${FFFD}B`],
      ['surrogate', Buffer.from([0xed, 0xa0, 0x80, 0x5a]), `${FFFD}${FFFD}${FFFD}Z`],
      ['truncated2', Buffer.from([0x61, 0xc3]), `a${FFFD}`],
      ['truncated3', Buffer.from([0x62, 0xe2, 0x82]), `b${FFFD}`],
      ['cesu8', Buffer.from([0xed, 0xa1, 0x8c, 0xed, 0xba, 0xa0]), FFFD.repeat(6)],
      ['bom', Buffer.from([0xef, 0xbb, 0xbf, 0x63]), '\u{FEFF}c'],
      ['lone80', Buffer.from([0x64, 0x80, 0x65]), `d${FFFD}e`],
      ['fffe', Buffer.from([0xff, 0xfe, 0x66]), `${FFFD}${FFFD}f`],
      ['valid4', Buffer.from([0xf0, 0x9f, 0x98, 0x80]), '\u{1F600}'],
    ]
    const files = vectors.map(([name, bytes]) => [`src/u8-${name}.ts`, bytes] as [string, Buffer])
    await withTree('f1-u8', files, async root => {
      const candidates = enumerateCandidates(root, ['**/*'])
      const mod = await atomic()
      // Empty needle hits every file, so hits carry the decoded contents.
      const res = await mod.scan({ paths: candidates, needles: [''], cwd: root, sep: sep, manifest: true })
      try {
        const ts = await scanFragmentSources({ include: ['**/*'], importFrom: NEEDLES, cwd: root })
        expect(res.retainedCount).toBe(vectors.length)
        expect(ts.scannedSources.length).toBe(vectors.length)
        const nativeContents = new Map(res.hits.map(hit => [hit.path, hit.content]))
        for (const source of ts.scannedSources) {
          expect(nativeContents.get(source.path)).toBe(source.content)
        }
        for (const [name, , text] of vectors) {
          const found = ts.scannedSources.find(source => source.path.endsWith(`u8-${name}.ts`))
          expect(found?.content).toBe(text)
        }
        expect(res.manifest).toEqual(expectedManifest(root, ts.scannedSources))
      } finally {
        await releaseToken(res.retentionToken)
      }
    })
  })

  it('(4) unnormalized spellings relativize and gate like node', async () => {
    await withTree('f1-unnorm', [['src/x.ts', CSS_RED], ['dist/y.ts', CSS_RED]], async root => {
      const spellings = [
        `${root}/src/x.ts`,
        `${root}/src/./x.ts`,
        `${root}/src/../src/x.ts`,
        `${root}//src//x.ts`,
      ]
      const ignored = `${root}/src/../dist/y.ts`
      const mod = await atomic()
      const res = await mod.scan({
        paths: [...spellings, ignored],
        needles: ['css'],
        cwd: root,
        sep: platformSep(),
        manifest: true,
      })
      try {
        // All five paths read (five hits); the four src spellings retain.
        expect(res.hits.length).toBe(5)
        expect(res.retainedCount).toBe(4)
        const rels = (res.manifest ?? []).map(entry => entry.path)
        expect(rels).toEqual(['src/x.ts', 'src/x.ts', 'src/x.ts', 'src/x.ts'])
        for (const spelling of spellings) {
          expect(relative(root, spelling)).toBe('src/x.ts')
        }
        // Identical bytes plus identical rels hash identically, four ways.
        const hashes = new Set((res.manifest ?? []).map(entry => entry.hash))
        expect(hashes.size).toBe(1)
      } finally {
        await releaseToken(res.retentionToken)
      }
    })
  })

})

describe('native scan outside cwd', () => {
  it('(5) out-of-cwd globs match and retain identically', async () => {
    const outsideFiles: Array<[string, string]> = [
      ['o.ts', NEO_IMPORT],
      ['.hidden.ts', NEO_IMPORT],
      ['x.d.ts', NEO_IMPORT],
      ['data.json', `{"note": "import '@reference-ui/neo'"}\n`],
      ['node_modules/dropped.ts', NEO_IMPORT],
    ]
    const root = makeRoot('f1-cwd')
    const outside = makeRoot('f1-outside')
    writeTree(root, [['src/ok.ts', CSS_RED]])
    writeTree(outside, outsideFiles)
    try {
      const include = [join(outside, '**/*')]
      const options = { include, importFrom: NEEDLES, cwd: root }
      const ts = await scanFragmentSources(options)
      const native = await scanFragmentSourcesNative(options)
      try {
        expect(native.matches).toEqual(ts.matches)
        expect(asRelative(outside, native.matches)).toEqual(['data.json', 'o.ts'])
        expect(native.retention.count).toBe(ts.scannedSources.length)
        expect(asRelative(outside, ts.scannedSources.map(source => source.path))).toEqual([
          '.hidden.ts',
          'o.ts',
          'x.d.ts',
        ])
        const candidates = enumerateCandidates(root, include)
        const mod = await atomic()
        const res = await mod.scan({
          paths: candidates,
          needles: NEEDLES,
          cwd: root,
          sep: platformSep(),
          manifest: true,
        })
        try {
          expect(res.manifest).toEqual(expectedManifest(root, ts.scannedSources))
        } finally {
          await releaseToken(res.retentionToken)
        }
      } finally {
        await releaseToken(native.retention.token)
      }
    } finally {
      rmSync(root, { recursive: true, force: true })
      rmSync(outside, { recursive: true, force: true })
    }
  })

})

const canRestrict = typeof process.geteuid === 'function' ? process.geteuid() !== 0 : true

describe('native scan fs edges', () => {
  it.runIf(canRestrict)('(6) unreadable files drop both sides, never throw', async () => {
    await withTree('f1-unread', [['src/ok.ts', NEO_IMPORT], ['src/dark.ts', NEO_IMPORT]], async root => {
      const dark = join(root, 'src/dark.ts')
      chmodSync(dark, 0o000)
      try {
        // Defensive: mode bits that still read (foreign ACLs) void the test.
        try {
          readFileSync(dark, 'utf-8')
          return
        } catch {
          // Unreadable as required; run the battery.
        }
        const options = { include: ['**/*'], importFrom: NEEDLES, cwd: root }
        const ts = await scanFragmentSources(options)
        const native = await scanFragmentSourcesNative(options)
        try {
          expect(native.matches).toEqual(ts.matches)
          expect(asRelative(root, native.matches)).toEqual(['src/ok.ts'])
          expect(native.retention.count).toBe(1)
          expect(ts.scannedSources.length).toBe(1)
        } finally {
          await releaseToken(native.retention.token)
        }
      } finally {
        chmodSync(dark, 0o644)
      }
    })
  })

  it('(7) empty, exact-64K, and oversize files read exactly', async () => {
    const alpha = (size: number): string =>
      Array.from({ length: size }, (_, index) => String.fromCharCode(97 + (index % 26))).join('')
    const files: Array<[string, string]> = [
      ['src/empty.ts', ''],
      ['src/exact.ts', alpha(65536)],
      ['src/big.ts', alpha(70000)],
    ]
    await withTree('f1-sizes', files, async root => {
      const candidates = enumerateCandidates(root, ['**/*'])
      const mod = await atomic()
      const res = await mod.scan({ paths: candidates, needles: [''], cwd: root, sep: sep, manifest: true })
      try {
        const ts = await scanFragmentSources({ include: ['**/*'], importFrom: NEEDLES, cwd: root })
        expect(res.retainedCount).toBe(3)
        expect(ts.scannedSources.length).toBe(3)
        const nativeContents = new Map(res.hits.map(hit => [hit.path, hit.content]))
        for (const source of ts.scannedSources) {
          expect(nativeContents.get(source.path)).toBe(source.content)
        }
        for (const [rel, content] of files) {
          const found = ts.scannedSources.find(source => source.path === join(root, rel))
          expect(found?.content).toBe(content)
        }
        expect(res.manifest).toEqual(expectedManifest(root, ts.scannedSources))
      } finally {
        await releaseToken(res.retentionToken)
      }
    })
  })

})

describe('native scan symlinks', () => {
  it.runIf(process.platform === 'darwin' || process.platform === 'linux')(
    '(8) symlinked files and dirs verify; dangling drops without throwing',
    async () => {
      await withTree('f1-links', [['src/real/a.ts', NEO_IMPORT]], async root => {
        symlinkSync(join(root, 'src/real'), join(root, 'src/linkdir'))
        symlinkSync(join(root, 'src/real/a.ts'), join(root, 'src/linkfile.ts'))
        symlinkSync(join(root, 'src/missing.ts'), join(root, 'src/dangling.ts'))
        const options = { include: ['**/*'], importFrom: NEEDLES, cwd: root }
        const ts = await scanFragmentSources(options)
        const native = await scanFragmentSourcesNative(options)
        try {
          // fg skips the dangling link on both paths; the linked dir and
          // file verify with the target bytes on both sides.
          expect(native.matches).toEqual(ts.matches)
          expect(asRelative(root, native.matches)).toEqual([
            'src/linkdir/a.ts',
            'src/linkfile.ts',
            'src/real/a.ts',
          ])
          expect(native.retention.count).toBe(3)
          expect(ts.scannedSources.length).toBe(3)
          const mod = await atomic()
          const explicit = [
            join(root, 'src/real/a.ts'),
            join(root, 'src/linkdir/a.ts'),
            join(root, 'src/linkfile.ts'),
            join(root, 'src/dangling.ts'),
          ]
          const res = await mod.scan({ paths: explicit, needles: [''], cwd: root, sep: sep })
          try {
            expect(res.hits.length).toBe(3)
            expect(res.retainedCount).toBe(3)
            const target = res.hits.find(hit => hit.path.endsWith('real/a.ts'))?.content
            expect(res.hits.find(hit => hit.path.endsWith('linkfile.ts'))?.content).toBe(target)
          } finally {
            await releaseToken(res.retentionToken)
          }
        } finally {
          await releaseToken(native.retention.token)
        }
      })
    }
  )

})

describe('native scan empty retention', () => {
  it('(9) negation-only include mints no token and compiles from disk', async () => {
    const files: Array<[string, string]> = [
      ['src/ok.ts', CSS_RED],
      ['src/excluded/skip.ts', CSS_RED],
      ['theme/tokens.ts', NEO_IMPORT],
    ]
    await withTree('f1-negation', files, async root => {
      const include = ['!**/excluded/**']
      const native = await scanFragmentSourcesNative({ include, importFrom: NEEDLES, cwd: root })
      expect(native.matches).toEqual([])
      // The native scan ran (not the TS fallback): no `files` key at all.
      expect('files' in native.retention).toBe(false)
      expect(native.retention.token).toBeUndefined()
      expect(native.retention.count).toBe(0)
      const mod = await atomic()
      const baseSystem = libSystemSpec()
      // Sync omits both `files` and the token; native scans disk itself.
      const request = { baseSystem, rootDir: root, include, logs: ['proof'] }
      const fromNative = await mod.compile(request)
      const fromDisk = await mod.compile({ baseSystem, rootDir: root, include, logs: ['proof'] })
      expect(fromNative.stylesheet).toBe(fromDisk.stylesheet)
      expect(fromNative.wants).toEqual(fromDisk.wants)
      expect(fromNative.diagnostics).toEqual(fromDisk.diagnostics)
      const colors = (fromDisk.wants ?? [])
        .filter(want => want.prop === 'color')
        .map(want => (want.value as { String?: string }).String ?? '')
        .sort()
      expect(colors).toEqual(['red', 'red'])
    })
  })
})
