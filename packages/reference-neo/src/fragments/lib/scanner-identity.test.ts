// Scanner identity lock: tricky-tree matches plus retention stay byte-exact.
// It takes a fixture (all nine IGNORE dirs, dotfiles, d.ts variants, extension
// traps, unicode, spaces, deep nesting, a file named dist) and pins the exact
// match and retention sets, the cwd-spelling invariance, and the out-of-cwd
// fallback — the diet contract. Semantics come from the native differential
// in scan-retention.test.ts; this file only locks the scanner to them.
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { scanFragmentSources } from './scanner.ts'

const NEEDLES = [
  '@reference-ui/neo',
  '@reference-ui/neo/config',
  '@reference-ui/system',
  '@reference-ui/core/config',
  '@reference-ui/cli/config',
]

const CSS = `import { css } from '@reference-ui/react'\nexport const a = css({ color: 'red' })\n`
const NEO = `import '@reference-ui/neo'\n${CSS}`

// [relative path, content]: dotfiles, d.ts, every IGNORE dir, extension traps.
const FIXTURE_FILES: Array<[string, string]> = [
  ['src/ok.ts', CSS],
  ['src/.hidden.ts', CSS],
  ['src/.hidden-neo.ts', NEO],
  ['src/t.d.ts', CSS],
  ['src/t-neo.d.ts', NEO],
  ['src/excluded/skip.ts', CSS],
  ['src/data.json', '{"note": "not a source"}\n'],
  ['src/frag-data.json', `{"note": "import '@reference-ui/neo'"}\n`],
  ['theme/tokens.ts', NEO],
  ['dist/a.ts', CSS],
  ['dist/frag.ts', NEO],
  ['node_modules/pkg/index.ts', CSS],
  ['.git/x.ts', CSS],
  ['.git/signal.ts', NEO],
  ['build/x.ts', CSS],
  ['.turbo/x.ts', CSS],
  ['target/x.ts', CSS],
  ['.reference-ui/x.ts', CSS],
  ['.reference/x.ts', CSS],
  ['.pipeline/x.ts', CSS],
  ['dist.ts', CSS],
  ['src/dist', CSS],
  ['src/dist-backup/keep.ts', CSS],
  ['src/noext', CSS],
  ['src/upper.TS', CSS],
  ['src/type.mts', CSS],
  ['src/trailings.', CSS],
  ['src/.ts', CSS],
  ['src/..ts', CSS],
  ['src/u.D.TS', CSS],
  ['src/.d.ts', CSS],
  ['src/x.ts.map', CSS],
  ['src/style.tsx', CSS],
  ['src/comp.jsx', CSS],
  ['src/lib.js', CSS],
  ['src/ünïcode.ts', CSS],
  ['src/with space.ts', CSS],
  ['src/a/b/c/deep.ts', CSS],
]

// Only the neo importers that survive dot:false plus the d.ts exclusion.
const EXPECTED_MATCHES = ['dist/frag.ts', 'src/frag-data.json', 'theme/tokens.ts']

// Live sources, dotfiles, and d.ts; IGNORE dirs and non-source extensions out.
const EXPECTED_RETAINED = [
  'dist.ts',
  'src/.d.ts',
  'src/.hidden-neo.ts',
  'src/.hidden.ts',
  'src/..ts',
  'src/a/b/c/deep.ts',
  'src/comp.jsx',
  'src/dist-backup/keep.ts',
  'src/excluded/skip.ts',
  'src/lib.js',
  'src/ok.ts',
  'src/style.tsx',
  'src/t-neo.d.ts',
  'src/t.d.ts',
  'src/with space.ts',
  'src/ünïcode.ts',
  'theme/tokens.ts',
]

const OUTSIDE_FILES: Array<[string, string]> = [
  ['o.ts', NEO],
  ['.hidden.ts', NEO],
  ['x.d.ts', NEO],
  ['data.json', `{"note": "import '@reference-ui/neo'"}\n`],
  ['node_modules/dropped.ts', NEO],
]

const EXPECTED_OUTSIDE_MATCHES = ['data.json', 'o.ts']
const EXPECTED_OUTSIDE_RETAINED = ['.hidden.ts', 'o.ts', 'x.d.ts']

function writeTree(root: string, files: Array<[string, string]>): void {
  for (const [rel, content] of files) {
    const full = join(root, rel)
    mkdirSync(dirname(full), { recursive: true })
    writeFileSync(full, content)
  }
}

function asRelative(root: string, paths: string[]): string[] {
  return paths.map(path => relative(root, path)).sort()
}

describe('scanner identity', () => {
  let root = ''
  let outside = ''

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'neo-scanner-identity-'))
    writeTree(root, FIXTURE_FILES)
    outside = mkdtempSync(join(tmpdir(), 'neo-scanner-outside-'))
    writeTree(outside, OUTSIDE_FILES)
  })

  afterAll(() => {
    if (root !== '') rmSync(root, { recursive: true, force: true })
    if (outside !== '') rmSync(outside, { recursive: true, force: true })
  })

  it('pins the tricky-tree match and retention sets', async () => {
    const { matches, scannedSources } = await scanFragmentSources({
      include: ['**/*'],
      importFrom: NEEDLES,
      cwd: root,
    })
    expect(asRelative(root, matches)).toEqual([...EXPECTED_MATCHES].sort())
    expect(asRelative(root, scannedSources.map(source => source.path))).toEqual([
      ...EXPECTED_RETAINED,
    ].sort())
    for (const source of scannedSources) {
      expect(source.content.length).toBeGreaterThan(0)
    }
  })

  it('is invariant under cwd spelling (trailing slash, dot-dot)', async () => {
    const spellings = [root, `${root}/`, join(root, 'src', '..')]
    for (const cwd of spellings) {
      const { matches, scannedSources } = await scanFragmentSources({
        include: ['**/*'],
        importFrom: NEEDLES,
        cwd,
      })
      expect(asRelative(root, matches)).toEqual([...EXPECTED_MATCHES].sort())
      expect(asRelative(root, scannedSources.map(source => source.path))).toEqual([
        ...EXPECTED_RETAINED,
      ].sort())
    }
  })

  it('falls back exactly for absolute out-of-cwd globs', async () => {
    const { matches, scannedSources } = await scanFragmentSources({
      include: [join(outside, '**/*')],
      importFrom: NEEDLES,
      cwd: root,
    })
    expect(asRelative(outside, matches)).toEqual([...EXPECTED_OUTSIDE_MATCHES].sort())
    expect(asRelative(outside, scannedSources.map(source => source.path))).toEqual([
      ...EXPECTED_OUTSIDE_RETAINED,
    ].sort())
  })
})
