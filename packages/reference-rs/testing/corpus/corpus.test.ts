/**
 * Corpus termination suite for reference-rs. Runs the three walkers over real trees: the tasty display walk over every
 * symbol of each declaration corpus, a styletrace probe for each corpus with importable exports (it imports and wraps
 * them), and the atlas analysis of reference-lib. Every run goes through runIsolated in its own child process, so a
 * hang or a crash ends as a reported outcome, and fails when a run ends by signal or timeout, exceeds its budget, reports
 * a walk limit (a truncated display, a runtime notice, a type-expansion guard), or resolves to too few symbols or
 * components. Corpus roots come from the installed packages, so a moved or emptied tree fails instead of passing.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { expectBounded, runIsolated, withTempDir } from '../index.js'
import type { AtlasAnalysisResult } from '../../modules/atlas/js/types.js'
import type { StyletraceDetailedResult } from '../../modules/styletrace/js/index.js'

const PACKAGE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const REPO_ROOT = path.resolve(PACKAGE_DIR, '../..')
const REFLIB_ROOT = path.join(REPO_ROOT, 'packages', 'reference-lib')
const REFLIB_SRC = path.join(REFLIB_ROOT, 'src')
const SYNC_ROOT = path.join(PACKAGE_DIR, 'modules', 'styletrace', 'fixtures', 'sync-root')
const TASTY_BUILD = path.join(PACKAGE_DIR, 'dist', 'tasty', 'build.mjs')

// Each budget is a fixed ceiling roughly five to ten times the measured cost on the reference machine (numbers in the README).
const TASTY_BUDGET_MS = 15_000
const TASTY_SYMBOL_BUDGET_MS = 150
const TASTY_KILL_MS = 60_000
const STYLETRACE_BUDGET_MS = 5_000
const STYLETRACE_KILL_MS = 30_000
const ATLAS_BUDGET_MS = 15_000
const ATLAS_KILL_MS = 60_000
const ATLAS_MIN_COMPONENTS = 250

// Workspace packages tried in order when resolving a corpus. The repo root comes first; zod and @tanstack/react-router
// are installed only under reference-docs, and @types/react and csstype only under reference-rs.
const RESOLVE_FROM = [
  path.join(REPO_ROOT, 'package.json'),
  path.join(PACKAGE_DIR, 'package.json'),
  path.join(REPO_ROOT, 'packages', 'reference-core', 'package.json'),
  path.join(REPO_ROOT, 'packages', 'reference-lib', 'package.json'),
  path.join(REPO_ROOT, 'packages', 'reference-docs', 'package.json'),
]

function resolvePackageJson(name: string): string {
  for (const from of RESOLVE_FROM) {
    try {
      return createRequire(from).resolve(`${name}/package.json`)
    } catch {
      // Not installed under this workspace package; the next one may have it.
    }
  }
  throw new Error(`corpus: ${name} is not installed under any workspace package in RESOLVE_FROM`)
}

function packageRoot(name: string): string {
  return path.dirname(resolvePackageJson(name))
}

/**
 * TypeScript 7 keeps its lib declarations in the platform package beside the native compiler, not in `typescript`
 * itself, so the lib corpus is `@typescript/typescript-<platform>-<arch>/lib`, resolved from the typescript package.
 */
function typescriptLibRoot(): string {
  const platformPackage = `@typescript/typescript-${process.platform}-${process.arch}`
  const platformJson = createRequire(resolvePackageJson('typescript')).resolve(`${platformPackage}/package.json`)
  return path.join(path.dirname(platformJson), 'lib')
}

const DTS = ['**/*.d.ts']
const DTS_ALL = ['**/*.d.ts', '**/*.d.mts', '**/*.d.cts']

interface TastyCorpus {
  name: string
  root: string
  include: string[]
  /** About half of today's symbol count, so a corpus that shrinks this far has moved or emptied. */
  minSymbols: number
}

const TASTY_CORPORA: TastyCorpus[] = [
  { name: '@types/react', root: packageRoot('@types/react'), include: DTS, minSymbols: 186 },
  { name: '@types/node', root: packageRoot('@types/node'), include: DTS, minSymbols: 40 },
  { name: 'csstype', root: packageRoot('csstype'), include: DTS, minSymbols: 359 },
  { name: 'typescript lib', root: typescriptLibRoot(), include: DTS, minSymbols: 1500 },
  { name: 'zod', root: packageRoot('zod'), include: DTS_ALL, minSymbols: 990 },
  { name: '@tanstack/react-router', root: packageRoot('@tanstack/react-router'), include: DTS_ALL, minSymbols: 75 },
  { name: 'reference-lib src', root: REFLIB_SRC, include: ['**/*.ts', '**/*.tsx'], minSymbols: 300 },
]

interface TastyReport {
  symbols: number
  slowest: { id: string; name: string; ms: number }
  truncated: string[]
  notices: string[]
  runtimeNotices: string[]
}

/**
 * The child's whole program: build tasty over one corpus, then project every symbol's display walk in this process.
 * getDisplayMembers() is getDisplayResult(...).members, so the result carries the walk limits that cut each walk.
 */
function tastyDriverSource(): string {
  return `const { buildTasty } = await import(${JSON.stringify(pathToFileURL(TASTY_BUILD).href)})
export async function walkCorpus(rootDir, include, outputDir) {
  const built = await buildTasty({ rootDir, include, outputDir })
  const api = built.api
  const ids = Object.keys((await api.loadManifest()).symbolsById).sort()
  const report = { symbols: ids.length, slowest: { id: '', name: '', ms: 0 }, truncated: [], notices: [], runtimeNotices: [] }
  for (const id of ids) {
    const t0 = performance.now()
    const symbol = await api.loadSymbolById(id)
    const display = await api.graph.getDisplayResult(symbol)
    const ms = performance.now() - t0
    if (ms > report.slowest.ms) report.slowest = { id, name: symbol.getName(), ms }
    if (display.truncated) report.truncated.push(id)
    report.notices.push(...display.notices)
  }
  report.runtimeNotices = api.getRuntimeNotices()
  return report
}
`
}

function walkTastyCorpus(corpus: TastyCorpus): TastyReport {
  return withTempDir('rs-corpus-tasty-', dir => {
    const driver = path.join(dir, 'walk-corpus.mjs')
    fs.writeFileSync(driver, tastyDriverSource())
    const run = runIsolated<TastyReport>({
      module: driver,
      fn: 'walkCorpus',
      args: [corpus.root, corpus.include, path.join(dir, 'out')],
      timeoutMs: TASTY_KILL_MS,
    })
    return expectBounded(run, { ms: TASTY_BUDGET_MS })
  })
}

describe('corpus termination: tasty display walks', () => {
  for (const corpus of TASTY_CORPORA) {
    it(`${corpus.name}: every symbol's display walk ends inside its budget with no limit fired`, () => {
      const report = walkTastyCorpus(corpus)
      expect(report.symbols, 'symbols in the corpus').toBeGreaterThanOrEqual(corpus.minSymbols)
      expect(report.truncated, 'symbols whose walk a limit cut short').toEqual([])
      expect(report.notices, 'walk-limit notices').toEqual([])
      expect(report.runtimeNotices, 'runtime notices').toEqual([])
      expect(
        report.slowest.ms,
        `slowest symbol ${report.slowest.name} (${report.slowest.id})`,
      ).toBeLessThanOrEqual(TASTY_SYMBOL_BUDGET_MS)
    })
  }
})

interface StyletraceProbe {
  name: string
  /** The specifier the probe imports from, written the way app code would write it. */
  specifier: string
  /** The path inside the probe folder where the corpus is linked, so the specifier resolves to it. */
  linkAt: string
  linkTo: string
  /** Value exports; each gets a wrapper that forwards its StyleProps into the export. */
  values: string[]
  /** Type-only exports; each becomes the props type of a wrapper, so styletrace expands it. */
  types: string[]
}

const STYLETRACE_PROBES: StyletraceProbe[] = [
  {
    name: '@types/react',
    specifier: '@types/react',
    linkAt: path.join('node_modules', '@types', 'react'),
    linkTo: packageRoot('@types/react'),
    values: ['Fragment', 'StrictMode', 'Suspense'],
    types: [],
  },
  {
    name: 'csstype',
    specifier: 'csstype',
    linkAt: path.join('node_modules', 'csstype'),
    linkTo: packageRoot('csstype'),
    values: [],
    types: ['Properties'],
  },
  {
    name: 'zod',
    specifier: 'zod',
    linkAt: path.join('node_modules', 'zod'),
    linkTo: packageRoot('zod'),
    values: ['ZodString', 'ZodType'],
    types: [],
  },
  {
    name: '@tanstack/react-router',
    specifier: '@tanstack/react-router',
    linkAt: path.join('node_modules', '@tanstack', 'react-router'),
    linkTo: packageRoot('@tanstack/react-router'),
    values: ['Link', 'Outlet', 'Match', 'RouterProvider'],
    types: [],
  },
  {
    name: 'reference-lib',
    specifier: './reference-lib/index',
    linkAt: path.join('src', 'reference-lib'),
    linkTo: REFLIB_SRC,
    values: ['Tooltip', 'Tabs', 'Menu', 'Switch', 'Accordion'],
    types: [],
  },
]

/**
 * The probe source: one positive control that forwards style props into a primitive, then a wrapper per value export
 * (forwarding into the corpus component) and per type export (typed by the corpus type).
 */
function probeSource(probe: StyletraceProbe): string {
  const lines = ["import { Div, type StyleProps } from '@reference-ui/react'"]
  if (probe.values.length > 0) lines.push(`import { ${probe.values.join(', ')} } from '${probe.specifier}'`)
  if (probe.types.length > 0) lines.push(`import type { ${probe.types.join(', ')} } from '${probe.specifier}'`)
  lines.push('export function WrapDiv(props: StyleProps) { return <Div {...props} /> }')
  for (const name of probe.values) {
    lines.push(`export function Wrap${name}(props: StyleProps) { return <${name} {...props} /> }`)
  }
  for (const name of probe.types) {
    lines.push(`export function Wrap${name}(props: StyleProps & ${name}) { return <Div {...props} /> }`)
  }
  return `${lines.join('\n')}\n`
}

function writeStyletraceProbe(dir: string, probe: StyletraceProbe): void {
  const linkPath = path.join(dir, probe.linkAt)
  fs.mkdirSync(path.dirname(linkPath), { recursive: true })
  fs.symlinkSync(probe.linkTo, linkPath, 'dir')
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'src', 'probe.tsx'), probeSource(probe))
}

function traceProbe(probe: StyletraceProbe): StyletraceDetailedResult {
  return withTempDir('rs-corpus-probe-', dir => {
    // A realpath root: on macOS, /var is a link to /private/var, and the walkers count a linked root differently.
    const root = fs.realpathSync(dir)
    writeStyletraceProbe(root, probe)
    const run = runIsolated<StyletraceDetailedResult>({
      module: 'styletrace',
      fn: 'traceDetailed',
      args: [root, SYNC_ROOT],
      timeoutMs: STYLETRACE_KILL_MS,
    })
    return expectBounded(run, { ms: STYLETRACE_BUDGET_MS })
  })
}

// STT-W-TYPE-EXPANSION-LIMIT means a type expansion hit a guard, and STT-E-* means the trace refused: both are findings.
function isGuardOrRefusal(code: string): boolean {
  return code === 'STT-W-TYPE-EXPANSION-LIMIT' || code.startsWith('STT-E-')
}

describe('corpus termination: styletrace probes', () => {
  for (const probe of STYLETRACE_PROBES) {
    it(`${probe.name}: a probe wrapping its exports traces inside budget with no guard fired`, () => {
      const detailed = traceProbe(probe)
      expect(
        detailed.bindings.map(binding => binding.name),
        'positive control: WrapDiv forwards style props into Div',
      ).toContain('WrapDiv')
      const guards = detailed.diagnostics.map(diagnostic => diagnostic.code).filter(isGuardOrRefusal)
      expect(guards, 'guard or refusal diagnostics').toEqual([])
    })
  }
})

describe('corpus termination: atlas over reference-lib', () => {
  it('analyzes every component inside its budget with no scan error', () => {
    const run = runIsolated<AtlasAnalysisResult>({
      module: 'atlas',
      fn: 'analyzeDetailed',
      args: [REFLIB_ROOT],
      timeoutMs: ATLAS_KILL_MS,
    })
    const result = expectBounded(run, { ms: ATLAS_BUDGET_MS })
    expect(result.components.length, 'components found').toBeGreaterThanOrEqual(ATLAS_MIN_COMPONENTS)
    const scanErrors = result.diagnostics.map(diagnostic => diagnostic.code).filter(code => code.startsWith('ATL-E-'))
    expect(scanErrors, 'atlas scan errors').toEqual([])
  })
})
