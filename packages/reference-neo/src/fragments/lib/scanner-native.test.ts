// Walk-completeness battery for the native scan: the agreed glob subset plus
// the fg-vs-native differential that proves it. It takes the check plus tricky
// trees and pins which include shapes assert a complete walk (bench patterns
// fire, extglob and star-adjacent shapes fall back) and that every asserted
// pattern enumerates at least what the native scope matches, so skipping the
// union backfill walk drops nothing.

import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import fg from 'fast-glob'
import { describe, expect, it } from 'vitest'
import { RETENTION_EXCLUDE } from './scanner.ts'
import { isCompleteWalkInclude } from './scanner-native.ts'
import {
  TRICKY_TREE,
  atomic,
  libSystemSpec,
  withTree,
} from '../base/scan-native-helpers.ts'

const CSS = (id: string): string =>
  `import { css } from '@reference-ui/react'\nexport const v = css({ color: '${id}' })\n`

// Literal special-char filenames that discriminate glob engines (parens,
// braces, brackets, pipes, stars, bangs, plus, at). Legal on posix and macOS;
// no two names fold together on case-insensitive filesystems.
const EXTRA_FILES: Array<[string, string]> = [
  'src/a.ts',
  'src/b.ts',
  'src/c.ts',
  'src/e.jsx',
  'src/f.js',
  'src/ab.ts',
  'src/ac.ts',
  'src/a(b).ts',
  'src/a+b.ts',
  'src/m@n.ts',
  'src/b!c.ts',
  'src/!lead.ts',
  'src/{a}.ts',
  'src/x[j].ts',
  'src/xj.ts',
  'src/p+q.ts',
  'src/v1.ts',
  'src/v2.ts',
  'src/v3.ts',
  'src/s*r.ts',
  'src/q?.ts',
  'src/a+(b).ts',
  'src/@(a|b).ts',
  'src/!(neg).ts',
  'src/[abc].ts',
  'src/a|b.ts',
  'src/{1..3}.ts',
  'src/{a,}.ts',
  'src/{}.ts',
  'src/a{1,2}.ts',
  'src/x1.ts',
  'src/x2.ts',
  'src/n/a.ts',
  'src/n/b.ts',
  'src/n/deep/c.ts',
  'src/skip/skipme.ts',
  'src/keep/keepme.ts',
  'src/foo.test.ts',
  'theme/deep/x.ts',
].map((rel, index) => [rel, CSS(`extra-${index}`)] as [string, string])

// Every pattern here must enumerate at least the native scope set (fg is a
// superset of native over kept source extensions). The battery pins the
// shapes the walk-completeness check asserts, including both bench globs.
const AGREED_PATTERNS: string[][] = [
  ['src/**/*.{ts,tsx}'],
  ['theme/**/*.ts'],
  ['src/**/*.{ts,tsx}', 'theme/**/*.ts'],
  ['**/*.ts'],
  ['src/**'],
  ['src/*.ts'],
  ['**/*'],
  ['src/**/*.tsx'],
  ['*.ts'],
  ['src/n/*.ts'],
  ['src/a?.ts'],
  ['src/q?.ts'],
  ['src/{a,b}.ts'],
  ['src/{a,b*}'],
  ['src/x{1,2}.ts'],
  ['src/{a,{b,c}}.ts'],
  ['src/{}.ts'],
  ['src/{a,}.ts'],
  ['**/*.{ts,tsx,js,jsx}'],
  ['src/**/*.ts', '!src/skip/**'],
  ['**/*.ts', '!**/*.test.ts'],
  ['theme/**', '!theme/deep/**'],
  ['src/*.[jt]s'],
  ['src/a[bc].ts'],
  ['src/a[!b].ts'],
  ['src/a[^b].ts'],
  ['src/[-ab].ts'],
  ['src/[]ab].ts'],
  ['src/a*b.ts'],
  ['src/*b.ts'],
  ['src/b!c.ts'],
  ['src/!lead.ts'],
  ['src/with space.ts'],
  ['**'],
  ['**/**'],
  ['src/*'],
  ['src/**/**/*.ts'],
  ['./src/**/*.ts'],
  ['src/./a.ts'],
  ['src/../src/a.ts'],
  ['src/**/a.ts'],
  ['SRC/**/*.ts'],
  ['src/**/*.{ts,tsx}', '!src/skip/**'],
]

// Every shape here must reject: the engines provably disagree (or the list
// has no positive base), so compile keeps its union backfill walk.
const REJECTED_PATTERNS: string[][] = [
  ['!src/skip/**'],
  ['src/a+(b).ts'],
  ['src/@(a|b).ts'],
  ['src/!(neg).ts'],
  ['src/a(b).ts'],
  ['!!src/a.ts'],
  ['src/**.ts'],
  ['src/a**b.ts'],
  ['src/a**'],
  ['**a.ts'],
  ['src/**/*.ts', '!src/a+(b).ts'],
  ['src/a|b.ts'],
  ['src/{1..3}.ts'],
  ['src/***/a.ts'],
  ['src/****/a.ts'],
  ['src/a{b.ts'],
  ['src/**/'],
  ['/src/**/*.ts'],
  ['src\\**/*.ts'],
  ['src/[[:alpha:]]b.ts'],
  ['src/**/*.ts', '!src/skip/**', 'src/a+(b).ts'],
]

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.turbo',
  'target',
  '.reference-ui',
  '.reference',
  '.pipeline',
])
const SOURCE_EXTENSIONS = new Set(['tsx', 'ts', 'jsx', 'js'])

// Mirror of the native retainable gate (IGNORE-dir ancestors plus final
// source extension) for the differential's kept-set computation.
function isKeptSource(relativePath: string): boolean {
  const segments = relativePath.split('/')
  if (segments.slice(0, -1).some(segment => IGNORE_DIRS.has(segment))) return false
  const base = segments[segments.length - 1]
  const dot = base.lastIndexOf('.')
  if (dot <= 0) return false
  return SOURCE_EXTENSIONS.has(base.slice(dot + 1))
}

describe('walk-completeness check', () => {
  it('asserts the bench globs and the agreed subset', () => {
    expect(isCompleteWalkInclude(['src/**/*.{ts,tsx}', 'theme/**/*.ts'], RETENTION_EXCLUDE)).toBe(
      true
    )
    for (const include of AGREED_PATTERNS) {
      expect(isCompleteWalkInclude(include, RETENTION_EXCLUDE)).toBe(true)
    }
  })

  it('rejects every disagreed shape', () => {
    for (const include of REJECTED_PATTERNS) {
      expect(isCompleteWalkInclude(include, RETENTION_EXCLUDE)).toBe(false)
    }
  })

  it('needs a positive base and the default prune', () => {
    expect(isCompleteWalkInclude([], RETENTION_EXCLUDE)).toBe(false)
    expect(isCompleteWalkInclude(['src/**/*.ts'], [])).toBe(true)
    expect(isCompleteWalkInclude(['src/**/*.ts'], [...RETENTION_EXCLUDE, 'dist/**'])).toBe(false)
    expect(isCompleteWalkInclude(['src/**/*.ts'], ['dist/**'])).toBe(false)
  })
})

describe('walk-completeness differential', () => {
  it('every asserted pattern enumerates at least the native scope set', async () => {
    await withTree('walk-agree', [...TRICKY_TREE, ...EXTRA_FILES], async root => {
      const mod = await atomic()
      const baseSystem = libSystemSpec()
      const rels = [...TRICKY_TREE, ...EXTRA_FILES].map(([rel]) => rel)
      const kept = rels.filter(isKeptSource)
      const files = rels.map(rel => ({ path: rel, content: readFileSync(join(root, rel), 'utf8') }))
      for (const include of AGREED_PATTERNS) {
        const enumerated = new Set(
          fg
            .sync(include, { cwd: root, absolute: true, ignore: RETENTION_EXCLUDE, dot: true })
            .map(found => relative(root, found))
        )
        const compiled = await mod.compile({ baseSystem, files, include, logs: ['proof'] })
        const native = new Set(
          (compiled.wants ?? []).map(want => want.file).filter(file => file !== undefined)
        )
        const missing = kept.filter(rel => native.has(rel) && !enumerated.has(rel))
        expect(missing).toEqual([])
      }
    })
  }, 120000)
})
