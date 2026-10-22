/**
 * Boundary smoke for the native addon: each contract export runs in a child on hostile input.
 * A row names an export and an input (malformed JSON, a 200-deep JSON document, an empty string, or a root that does not exist).
 * The child loads the addon through the dist's getReferenceNative and calls the export inside a try/catch, so the outcome is a JS Error or a string payload.
 * A signal, a timeout, a non-zero exit, a missing export or a non-Error throw fails the row, and the message names the export and the input.
 * Each row first waits briefly for dist/index.mjs, which a concurrent build:js removes while it renames outputs in; a child that still
 * cannot load it fails and names that build.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { runIsolated } from '../../../testing/isolated.js'
import type { IsolatedRun } from '../../../testing/isolated.js'
import { resolveReferenceRsPackageDir } from './loader.js'
import { REQUIRED_REFERENCE_NATIVE_EXPORTS } from './shared/native-contract.js'

/** What the child reports: the export's string payload, a thrown value, or why the export could not be called. */
type ProbeOutcome =
  | { payload: unknown }
  | { threw: string; isError: boolean }
  | { missing: string }
  | { unavailable: true }

interface Scratch {
  /** Parent-owned directory. The probe module and every root a row points at live inside it. */
  dir: string
  probe: string
  /** An existing, empty root for rows that need a real directory. */
  existing: string
  /** A path inside the scratch directory that does not exist. */
  missing: string
}

interface Row {
  export: string
  input: string
  args: (scratch: Scratch) => unknown[]
}

const TIMEOUT_MS = 10_000
const DIST_WAIT_MS = 2_000
const DIST_RETRY_MS = 20
// build:js rewrites packages/reference-rs/dist in place: build-bundle removes the old outputs, then renames the new ones in.
const CONCURRENT_BUILD_HINT =
  'build:js rewrites packages/reference-rs/dist in place (build-bundle removes the old outputs, then renames the new ones in), so a build that runs at the same time leaves dist/index.mjs absent. Rerun once no other build:js is running.'
const SLEEP_CELL = new Int32Array(new SharedArrayBuffer(4))
const MALFORMED_JSON = '{"unterminated": [1, 2'
// Two 200-level shapes. Each export's parser stops at a different point (recursion limit, type mismatch or missing field),
// so an array nest and an object nest are both needed to reach the deep path.
const DEEP_ARRAY_JSON = '['.repeat(200) + ']'.repeat(200)
const DEEP_OBJECT_JSON = '{"x":'.repeat(200) + '1' + '}'.repeat(200)
const PACKAGE_DIR = resolveReferenceRsPackageDir(import.meta.url)
const DIST_INDEX = path.join(PACKAGE_DIR, 'dist', 'index.mjs')

const JSON_EXPORTS = ['emitDtsSync', 'emitDtsDetailed', 'compileSystem', 'scanSystem', 'releaseScan'] as const
const JSON_INPUTS: ReadonlyArray<readonly [string, string]> = [
  ['malformed JSON', MALFORMED_JSON],
  ['200-deep JSON array', DEEP_ARRAY_JSON],
  ['200-deep JSON object', DEEP_OBJECT_JSON],
  ['empty string', ''],
]
const STYLETRACE_EXPORTS = ['analyzeStyletrace', 'analyzeStyletraceBindings', 'analyzeStyletraceDetailed'] as const

// One row per export and input. Every export in the native contract must appear at least once.
const ROWS: Row[] = [
  { export: 'getNativeCapabilities', input: 'no arguments', args: () => [] },
  { export: 'primitivesVocabulary', input: 'no arguments', args: () => [] },
  ...JSON_EXPORTS.flatMap((name): Row[] =>
    JSON_INPUTS.map(([input, text]) => ({ export: name, input, args: () => [text] })),
  ),
  { export: 'analyzeAtlas', input: 'empty string root', args: () => ['', null] },
  { export: 'analyzeAtlas', input: 'nonexistent root', args: (s) => [s.missing, null] },
  { export: 'analyzeAtlas', input: 'malformed JSON config', args: (s) => [s.existing, MALFORMED_JSON] },
  { export: 'analyzeAtlas', input: '200-deep JSON array config', args: (s) => [s.existing, DEEP_ARRAY_JSON] },
  { export: 'analyzeAtlas', input: '200-deep JSON object config', args: (s) => [s.existing, DEEP_OBJECT_JSON] },
  { export: 'analyzeAtlas', input: 'empty string config', args: (s) => [s.existing, ''] },
  { export: 'scanAndEmitModules', input: 'empty string root', args: () => ['', ['src']] },
  { export: 'scanAndEmitModules', input: 'nonexistent root', args: (s) => [s.missing, ['src']] },
  { export: 'scanAndEmitModules', input: '200-deep JSON array include list', args: (s) => [s.existing, JSON.parse(DEEP_ARRAY_JSON)] },
  { export: 'scanAndEmitModules', input: 'empty string include', args: (s) => [s.existing, ['']] },
  ...STYLETRACE_EXPORTS.flatMap((name): Row[] => [
    { export: name, input: 'empty string root', args: () => ['', null] },
    { export: name, input: 'nonexistent root', args: (s) => [s.missing, null] },
    { export: name, input: 'empty string optional root', args: (s) => [s.existing, ''] },
  ]),
]

/**
 * The probe the child runs. It loads the addon with the dist's own loader, so REFERENCE_UI_NATIVE_PATH applies as it does
 * in production. It changes into the scratch root first, so a relative empty path resolves inside the parent's directory.
 */
function probeSource(distIndexUrl: string): string {
  return `import { getReferenceNative } from ${JSON.stringify(distIndexUrl)}
export function probe(name, args, cwd) {
  const native = getReferenceNative()
  if (native === null) return { unavailable: true }
  if (typeof native[name] !== 'function') return { missing: name }
  process.chdir(cwd)
  try {
    return { payload: native[name](...args) }
  } catch (error) {
    return { threw: String(error?.message ?? error), isError: error instanceof Error }
  }
}
`
}

function createScratch(): Scratch {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rs-native-smoke-'))
  const existing = path.join(dir, 'root')
  fs.mkdirSync(existing)
  const probe = path.join(dir, 'probe.mjs')
  fs.writeFileSync(probe, probeSource(pathToFileURL(DIST_INDEX).href))
  return { dir, probe, existing, missing: path.join(dir, 'missing-root') }
}

function stderrTail(run: IsolatedRun<unknown>): string {
  return run.stderr === '' ? '' : `; stderr: ${run.stderr}`
}

/** Why the child ended without writing an outcome: a timeout, a signal, or a non-zero exit. */
function childFailure(run: IsolatedRun<ProbeOutcome>): string {
  if (run.timedOut) return `timed out and was killed after ${run.ms} ms`
  if (run.signal !== null) return `ended by signal ${run.signal}${stderrTail(run)}`
  if (missingDistIndex(run)) return `${DIST_INDEX} was missing when the child loaded it; ${CONCURRENT_BUILD_HINT}`
  if (run.status !== 0) return `exited with status ${run.status}${stderrTail(run)}`
  return 'exited 0 without writing an outcome'
}

/** The child failed to import dist/index.mjs: the probe loads the addon through it, so the file was absent at that moment. */
function missingDistIndex(run: IsolatedRun<ProbeOutcome>): boolean {
  return run.status !== 0 && run.stderr.includes(DIST_INDEX) && /ERR_MODULE_NOT_FOUND|Cannot find module/.test(run.stderr)
}

function sleepMs(ms: number): void {
  Atomics.wait(SLEEP_CELL, 0, 0, ms)
}

/**
 * Returns once `file` exists. A build:js removes dist/index.mjs for a moment while it renames the new outputs in, so a row
 * that finds the file absent waits for it to return; a file still missing after the budget fails with the cause named.
 */
function awaitFile(file: string, budgetMs: number): void {
  for (let waited = 0; !fs.existsSync(file); waited += DIST_RETRY_MS) {
    if (waited >= budgetMs) {
      throw new Error(`${file} is still missing after waiting up to ${budgetMs} ms; ${CONCURRENT_BUILD_HINT}`)
    }
    sleepMs(DIST_RETRY_MS)
  }
}

/** Why a written outcome is not a boundary pass, or null when the export threw a JS Error or returned a string. */
function outcomeFailure(outcome: ProbeOutcome): string | null {
  if ('unavailable' in outcome) return 'the native addon did not load'
  if ('missing' in outcome) return `the addon exports no function named ${outcome.missing}`
  if ('threw' in outcome) return outcome.isError ? null : `threw a value that is not a JS Error: ${outcome.threw}`
  return typeof outcome.payload === 'string' ? null : `returned ${typeof outcome.payload}, not a string payload`
}

/** Passes when the child exited 0 and the export threw a JS Error or returned a string; names the row otherwise. */
function assertBoundary(row: Row, run: IsolatedRun<ProbeOutcome>): void {
  const failure = run.result === undefined ? childFailure(run) : outcomeFailure(run.result)
  if (failure !== null) throw new Error(`${row.export} with ${row.input}: ${failure}`)
}

describe('native boundary smoke', () => {
  let scratch: Scratch | undefined

  beforeAll(() => {
    if (!fs.existsSync(DIST_INDEX)) {
      throw new Error(`${DIST_INDEX} does not exist; build the JS dist first (pnpm run build:js in packages/reference-rs)`)
    }
    scratch = createScratch()
  })

  afterAll(() => {
    if (scratch) fs.rmSync(scratch.dir, { recursive: true, force: true })
  })

  it('has a row for every export in the native contract', () => {
    const covered = new Set(ROWS.map((row) => row.export))
    const uncovered = [...REQUIRED_REFERENCE_NATIVE_EXPORTS].filter((name) => !covered.has(name))
    expect(uncovered).toEqual([])
  })

  for (const row of ROWS) {
    it(`${row.export} with ${row.input}`, () => {
      if (!scratch) throw new Error('the scratch directory was not created')
      awaitFile(DIST_INDEX, DIST_WAIT_MS)
      const run = runIsolated<ProbeOutcome>({
        module: scratch.probe,
        fn: 'probe',
        args: [row.export, row.args(scratch), scratch.existing],
        timeoutMs: TIMEOUT_MS,
      })
      assertBoundary(row, run)
    })
  }
})

describe('the failure messages and the dist wait', () => {
  it('names a dist/index.mjs that was missing when the child loaded it as a concurrent build', () => {
    const run: IsolatedRun<ProbeOutcome> = {
      result: undefined,
      signal: null,
      status: 1,
      ms: 41,
      timedOut: false,
      stderr: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '${DIST_INDEX}' imported from /tmp/probe.mjs`,
    }
    const message = childFailure(run)
    expect(message).toContain(DIST_INDEX)
    expect(message).toContain('build:js')
    expect(message).not.toContain('exited with status')
  })

  it('keeps the exit status and stderr for any other non-zero exit', () => {
    const run: IsolatedRun<ProbeOutcome> = {
      result: undefined,
      signal: null,
      status: 1,
      ms: 41,
      timedOut: false,
      stderr: 'SyntaxError: boom',
    }
    expect(childFailure(run)).toBe('exited with status 1; stderr: SyntaxError: boom')
  })

  it('returns at once for a file that exists, and gives up with the cause named for one that stays missing', () => {
    expect(() => awaitFile(fileURLToPath(import.meta.url), 0)).not.toThrow()
    const missing = path.join(os.tmpdir(), `contained-missing-${process.pid}-${Date.now()}`)
    expect(() => awaitFile(missing, 30)).toThrow(/is still missing after waiting up to 30 ms.*build:js/)
  })
})
