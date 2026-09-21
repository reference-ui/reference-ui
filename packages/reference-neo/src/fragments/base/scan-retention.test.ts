// Differential: TS retention scan vs native disk scan over a tricky tree.
// It takes a fixture (dotfile, d.ts, dist/-nested, node_modules/, json,
// negation-only, empty-match, match-before-filter) and asserts compile({files}) is byte-identical
// to compile({rootDir}) on wants, sheets, and diagnostics — the C3 mirror
// contract — plus the production files+rootDir shape on every arm.

import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { EvaluatedSystemSpec } from '@reference-ui/rust/contracts'
import type { ReferenceUIConfig } from '../../config/types.ts'
import { scanFragmentFiles } from './index.ts'

// Structural compile boundary (mirrors sync/native.ts): the rs dist type
// entries cannot resolve named exports under NodeNext, so the test
// describes the call shape locally and imports the runtime dynamically.
interface TestWant {
  prop: string
  value: unknown
}

interface TestDiagnostic {
  severity: 'error' | 'warning' | 'info'
  message: string
  code?: string
  file?: string
  line?: number
  column?: number
}

interface TestCompileResult {
  stylesheet: string
  portableStylesheet?: string
  wants?: TestWant[]
  diagnostics: TestDiagnostic[]
}

interface TestCompileRequest {
  baseSystem: EvaluatedSystemSpec
  rootDir?: string
  files?: Array<{ path: string; content: string }>
  include?: string[]
  logs?: string[]
}

interface AtomicModule {
  compile(request: TestCompileRequest): Promise<TestCompileResult>
}

async function compile(request: TestCompileRequest): Promise<TestCompileResult> {
  const atomic = (await import('@reference-ui/rust/atomic')) as unknown as AtomicModule
  return atomic.compile(request)
}

// Symlinked-prefix coverage for path-string identity (ruling f): /tmp is a
// symlink on macOS, and neither side canonicalizes, so both string-join the
// same unmodified root. Elsewhere fall back to the real tmpdir.
function fixtureBase(): string {
  return process.platform === 'darwin' ? '/tmp' : tmpdir()
}

function cssFile(color: string): string {
  return `import { css } from '@reference-ui/react'\nexport const a = css({ color: '${color}' })\n`
}

const FIXTURE_FILES: Array<[string, string]> = [
  ['src/ok.ts', cssFile('red')],
  ['src/.hidden.ts', cssFile('blue')],
  ['src/t.d.ts', cssFile('green')],
  ['src/excluded/skip.ts', cssFile('orange')],
  ['dist/nested.ts', cssFile('purple')],
  ['node_modules/pkg/index.ts', cssFile('pink')],
  ['src/data.json', '{"note": "not a source"}\n'],
  ['theme/tokens.ts', `import '@reference-ui/neo'\n`],
]

function libSystemSpec(): EvaluatedSystemSpec {
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

function colorWants(result: TestCompileResult): string[] {
  return (result.wants ?? [])
    .filter(want => want.prop === 'color')
    .map(want => (want.value as { String?: string }).String ?? '')
    .sort()
}

// GAPS-2 signals: fragment imports in files retention must drop (IGNORE
// dir, non-source extension). Old semantics matched them; retention keeps
// neither, so both compile sides stay bare of their signals.
function addUnretainedSignalFiles(root: string): { distFrag: string; jsonFrag: string } {
  const distFrag = join(root, 'dist', 'frag.ts')
  const jsonFrag = join(root, 'src', 'frag-data.json')
  writeFileSync(distFrag, `import '@reference-ui/neo'\n${cssFile('teal')}`)
  writeFileSync(jsonFrag, `{"note": "import '@reference-ui/neo'"}\n`)
  return { distFrag, jsonFrag }
}

function expectIdentical(actual: TestCompileResult, expected: TestCompileResult): void {
  expect(actual.stylesheet).toBe(expected.stylesheet)
  expect(actual.portableStylesheet).toBe(expected.portableStylesheet)
  expect(actual.wants).toEqual(expected.wants)
  expect(actual.diagnostics).toEqual(expected.diagnostics)
}

describe('retention scan differential', () => {
  let root = ''
  let spec: EvaluatedSystemSpec | undefined

  beforeAll(() => {
    root = mkdtempSync(join(fixtureBase(), 'lanea-retention-'))
    for (const [rel, content] of FIXTURE_FILES) {
      const full = join(root, rel)
      mkdirSync(dirname(full), { recursive: true })
      writeFileSync(full, content)
    }
    spec = libSystemSpec()
  })

  afterAll(() => {
    if (root !== '') rmSync(root, { recursive: true, force: true })
  })

  async function compileArms(include: string[]) {
    const config: ReferenceUIConfig = { name: 'retention', include }
    const { matches, scannedSources } = await scanFragmentFiles(root, config)
    const baseSystem = spec as EvaluatedSystemSpec
    const fromFiles = await compile({ baseSystem, files: scannedSources, include, logs: ['proof'] })
    const fromRoot = await compile({ baseSystem, rootDir: root, include, logs: ['proof'] })
    const production = await compile({
      baseSystem,
      rootDir: root,
      files: scannedSources,
      include,
      logs: ['proof'],
    })
    return { matches, scannedSources, fromFiles, fromRoot, production }
  }

  it('star include: provided files equal the disk scan, decoys dropped both sides', async () => {
    const { matches, scannedSources, fromFiles, fromRoot, production } = await compileArms(['**/*'])
    expectIdentical(fromFiles, fromRoot)
    expectIdentical(production, fromRoot)
    // Retention keeps live sources, dotfiles, and d.ts; drops dist/,
    // node_modules/, and the json (extension gate under a star glob).
    const retained = scannedSources.map(source => relative(root, source.path)).sort()
    expect(retained).toEqual([
      join('src', '.hidden.ts'),
      join('src', 'excluded', 'skip.ts'),
      join('src', 'ok.ts'),
      join('src', 't.d.ts'),
      join('theme', 'tokens.ts'),
    ])
    // Matches emulate dot:false plus the d.ts exclusion: only the neo import.
    expect(matches).toEqual([join(root, 'theme', 'tokens.ts')])
    expect(colorWants(fromRoot)).toEqual(['blue', 'green', 'orange', 'red'])
    expect(colorWants(fromFiles)).toEqual(['blue', 'green', 'orange', 'red'])
    expect(fromRoot.diagnostics.filter(entry => entry.severity === 'error')).toEqual([])
  })

  it('positive plus negation: excluded subtree drops from both scans', async () => {
    // Leading-** positives match absolute provided paths without a root, so
    // the rootless strict arm shares the rootDir arm's scope exactly (native
    // matches_file only tries root-relative forms when a root is given).
    const { matches, scannedSources, fromFiles, fromRoot, production } = await compileArms([
      '**/src/**/*',
      '!**/excluded/**',
    ])
    expectIdentical(fromFiles, fromRoot)
    expectIdentical(production, fromRoot)
    const retained = scannedSources.map(source => relative(root, source.path)).sort()
    expect(retained).toEqual([
      join('src', '.hidden.ts'),
      join('src', 'ok.ts'),
      join('src', 't.d.ts'),
    ])
    expect(matches).toEqual([])
    expect(colorWants(fromRoot)).toEqual(['blue', 'green', 'red'])
  })

  it('negation-only include: empty retention falls back to the disk scan', async () => {
    // fg has no positive base for negation-only, so retention is empty and
    // sync omits `files`; native then scans disk itself (ruling e). The
    // production shape proves the fallback equals the plain disk compile.
    const { matches, scannedSources, fromFiles, fromRoot, production } = await compileArms([
      '!**/excluded/**',
    ])
    expect(scannedSources).toEqual([])
    expect(matches).toEqual([])
    expectIdentical(production, fromRoot)
    expect(colorWants(fromRoot)).toEqual(['blue', 'green', 'red'])
    expect(fromFiles.wants ?? []).toEqual([])
  })

  it('empty-match include: retention is empty and both compiles are bare', async () => {
    const { matches, scannedSources, fromFiles, fromRoot, production } = await compileArms([
      'nowhere/**',
    ])
    expect(scannedSources).toEqual([])
    expect(matches).toEqual([])
    expectIdentical(fromFiles, fromRoot)
    expectIdentical(production, fromRoot)
    expect(fromRoot.wants ?? []).toEqual([])
  })

  it('match-before-filter: IGNORE-dir and non-source signals match but stay out of retention', async () => {
    // GAPS-2: old semantics matched over every readable fg hit (dot/d.ts
    // excluded only), so these carry the neo import yet compile from neither
    // side. Runs last: it extends the shared root, so it must not precede
    // the arms above.
    const { distFrag, jsonFrag } = addUnretainedSignalFiles(root)
    const { matches, scannedSources, fromFiles, fromRoot, production } = await compileArms(['**/*'])
    expect(matches).toContain(join(root, 'theme', 'tokens.ts'))
    expect(matches).toContain(distFrag)
    expect(matches).toContain(jsonFrag)
    const retained = scannedSources.map(source => relative(root, source.path))
    expect(retained).not.toContain(join('dist', 'frag.ts'))
    expect(retained).not.toContain(join('src', 'frag-data.json'))
    expectIdentical(fromFiles, fromRoot)
    expectIdentical(production, fromRoot)
    expect(colorWants(fromRoot)).toEqual(['blue', 'green', 'orange', 'red'])
  })
})
