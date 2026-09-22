// Shared helpers for the native-scan differential battery (F1 §6.8).
// They take temp trees plus scan outputs and emit manifests, hashes, and the
// native call boundary. The FNV-1a manifest form here must match the seal
// script and the Rust entry hash byte-for-byte; the goldens pin that.

import { createHash, randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { sep } from 'node:path'
import fg from 'fast-glob'
import type { EvaluatedSystemSpec } from '@reference-ui/rust/contracts'
import { RETENTION_EXCLUDE } from '../lib/scanner.ts'
import type { ScannedSource } from '../lib/scanner.ts'

export const NEEDLES = [
  '@reference-ui/neo',
  '@reference-ui/neo/config',
  '@reference-ui/system',
  '@reference-ui/core/config',
  '@reference-ui/cli/config',
]

export const CSS_RED =
  "import { css } from '@reference-ui/react'\nexport const a = css({ color: 'red' })\n"
export const NEO_IMPORT = `import '@reference-ui/neo'\n${CSS_RED}`

// Tricky tree: live, dotfile, d.ts (plain plus neo), IGNORE/extension decoys,
// traps (noext, upper.TS), spaces, unicode, nesting.
export const TRICKY_TREE: Array<[string, string]> = [
  ['src/ok.ts', CSS_RED],
  ['src/.hidden.ts', CSS_RED],
  ['src/t.d.ts', CSS_RED],
  ['src/neo.ts', NEO_IMPORT],
  ['src/.hidden-neo.ts', NEO_IMPORT],
  ['src/t-neo.d.ts', NEO_IMPORT],
  ['dist/frag.ts', NEO_IMPORT],
  ['node_modules/pkg/x.ts', CSS_RED],
  ['src/data.json', '{"note": "not a source"}\n'],
  ['src/frag-data.json', `{"note": "import '@reference-ui/neo'"}\n`],
  ['theme/tokens.ts', NEO_IMPORT],
  ['src/dist-backup/keep.ts', CSS_RED],
  ['dist.ts', CSS_RED],
  ['src/noext', CSS_RED],
  ['src/upper.TS', CSS_RED],
  ['src/with space.ts', CSS_RED],
  ['src/ünïcode.ts', CSS_RED],
  ['src/a/b/c/deep.ts', CSS_RED],
]

// Neo importers past dot:false plus the d.ts exclusion; IGNORE/extension
// survivors (live, dotfiles, d.ts; decoys and traps out).
export const TRICKY_MATCHES = ['dist/frag.ts', 'src/frag-data.json', 'src/neo.ts', 'theme/tokens.ts']
export const TRICKY_RETAINED = [
  'dist.ts',
  'src/.hidden-neo.ts',
  'src/.hidden.ts',
  'src/a/b/c/deep.ts',
  'src/dist-backup/keep.ts',
  'src/neo.ts',
  'src/ok.ts',
  'src/t-neo.d.ts',
  'src/t.d.ts',
  'src/with space.ts',
  'src/ünïcode.ts',
  'theme/tokens.ts',
]

export function asRelative(root: string, paths: string[]): string[] {
  return paths.map(path => relative(root, path)).sort(byteSort)
}

// Structural native boundary (mirrors sync/native.ts): the rs dist type
// entries cannot resolve named exports under NodeNext, so tests describe the
// call shape locally and import the runtime dynamically.
export interface TestScanResponse {
  hits: ScannedSource[]
  retentionToken?: number
  retainedCount: number
  manifest?: Array<{ path: string; hash: string }>
}

export interface TestCompileResult {
  stylesheet: string
  portableStylesheet?: string
  runtime: unknown
  wants?: Array<{ prop: string; value: unknown; file?: string }>
  diagnostics: Array<{
    severity: string
    message: string
    code?: string
    file?: string
    line?: number
    column?: number
  }>
  tracedJsxHosts?: string[]
}

interface TestCompileRequest {
  baseSystem?: EvaluatedSystemSpec
  spec?: EvaluatedSystemSpec
  schemaVersion?: number
  rootDir?: string
  sourceRoot?: string
  files?: ScannedSource[]
  retentionToken?: number
  include?: string[]
  logs?: string[]
}

interface AtomicTestModule {
  scan(request: {
    paths: string[]
    needles: string[]
    cwd: string
    sep: string
    retain?: boolean
    manifest?: boolean
    walkComplete?: boolean
    include?: string[]
  }): Promise<TestScanResponse>
  compile(request: TestCompileRequest): Promise<TestCompileResult>
  releaseScan(request: { retentionToken: number }): Promise<{ released: boolean }>
}

export async function atomic(): Promise<AtomicTestModule> {
  return (await import('@reference-ui/rust/atomic')) as unknown as AtomicTestModule
}

export async function releaseToken(token: number | undefined): Promise<void> {
  if (token === undefined) return
  await (await atomic()).releaseScan({ retentionToken: token })
}

// Symlinked-prefix coverage for path-string identity: /tmp is a symlink on
// macOS, and neither side canonicalizes, so both string-join the same
// unmodified root. Elsewhere fall back to the real tmpdir.
export function fixtureBase(): string {
  return process.platform === 'darwin' ? '/tmp' : tmpdir()
}

export function makeRoot(prefix: string): string {
  return join(fixtureBase(), `${prefix}-${process.pid}-${randomUUID().slice(0, 8)}`)
}

export function writeTree(root: string, files: Array<[string, string | Buffer]>): void {
  for (const [rel, content] of files) {
    const full = join(root, rel)
    mkdirSync(dirname(full), { recursive: true })
    writeFileSync(full, content)
  }
}

/** Test-side fg enumeration: the exact glob call both scanners share. */
export function enumerateCandidates(root: string, include: string[]): string[] {
  return fg.sync(include, {
    cwd: root,
    absolute: true,
    ignore: RETENTION_EXCLUDE,
    dot: true,
  })
}

export function fnv1a64(bytes: Buffer): string {
  let hash = 0xcbf29ce484222325n
  const prime = 0x100000001b3n
  const mask = 0xffffffffffffffffn
  for (const byte of bytes) {
    hash ^= BigInt(byte)
    hash = (hash * prime) & mask
  }
  return hash.toString(16).padStart(16, '0')
}

/** Manifest entry hash: FNV-1a over rel-path bytes, one zero, content bytes. */
export function entryHash(rel: string, content: string): string {
  return fnv1a64(
    Buffer.concat([Buffer.from(rel, 'utf8'), Buffer.from([0]), Buffer.from(content, 'utf8')])
  )
}

export function byteSort(a: string, b: string): number {
  return Buffer.compare(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
}

/** Expected manifest from TS-side bytes: rel paths, byte-sorted entries. */
export function expectedManifest(
  root: string,
  sources: ScannedSource[]
): Array<{ path: string; hash: string }> {
  return sources
    .map(source => {
      const rel = relative(root, source.path)
      return { path: rel, hash: entryHash(rel, source.content) }
    })
    .sort((a, b) => byteSort(a.path, b.path))
}

/**
 * Canonical manifest sha: sha256 over the JSON array of [rel, hash] pairs in
 * byte order. The committed goldens seal this string; the diet reproduces it.
 */
export function manifestSha(entries: Array<{ path: string; hash: string }>): string {
  const pairs = [...entries]
    .sort((a, b) => byteSort(a.path, b.path))
    .map(entry => [entry.path, entry.hash])
  return createHash('sha256').update(JSON.stringify(pairs), 'utf8').digest('hex')
}

export function platformSep(): string {
  return sep
}

/** Build a temp tree, run the body, remove the tree (tests stay isolated). */
export async function withTree<T>(
  prefix: string,
  files: Array<[string, string | Buffer]>,
  body: (root: string) => Promise<T>
): Promise<T> {
  const root = makeRoot(prefix)
  writeTree(root, files)
  try {
    return await body(root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

export function libSystemSpec(): EvaluatedSystemSpec {
  const specPath = join(
    import.meta.dirname,
    '..',
    '..',
    '..',
    '..',
    'reference-rs',
    'modules',
    'atomic',
    'tests',
    'fixtures',
    'lib-system-spec.json'
  )
  return JSON.parse(readFileSync(specPath, 'utf-8')) as EvaluatedSystemSpec
}
