import { spawnSync } from 'node:child_process'
import { readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'

/**
 * T18 icons composition (component-ownership plan §9.5): a style prop on an
 * `@reference-ui/icons` icon is backed when the icons baseSystem is composed,
 * and warns `ATM-W-EXTERNAL-UNBACKED` when it is not. A warning is a sync
 * output, so each leg is its own tiny project under `tests/sync/`, synced
 * here with the installed `ref sync <dir> --json`:
 *
 * - `backed/` layers `@reference-ui/icons/baseSystem`: the sheet backs
 *   `.reference-icons__c_t18BackedInk` and nothing warns.
 * - `unbacked/` composes nothing: one warning at the styled icon's line,
 *   naming `@reference-ui/icons`; the unstyled icon stays silent.
 *
 * The browser half (an icon paints when composed) is the T18 app's `t18-icon`.
 *
 * RED TIER. Today the uncomposed icon is dropped silently (plan probe 4).
 * Flip `EXTERNAL_UNBACKED_LANDED` to true once the warning (plan S3, on top
 * of S1) is on the branch; vitest then fails if the marked test still fails.
 */
const EXTERNAL_UNBACKED_LANDED = false
const UNBACKED_CODE = 'ATM-W-EXTERNAL-UNBACKED'
const SYNC_TIMEOUT_MS = 240_000

const syncRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../sync')
const requireFromSuite = createRequire(import.meta.url)

interface DiagnosticRow {
  severity: string
  code: string
  message: string
  file?: string
  line?: number
  column?: number
}

interface SyncRun {
  status: number | null
  rows: DiagnosticRow[]
}

/** The `ref` bin of the installed `@reference-ui/core` (packed tarball in the matrix). */
function refBin(): string {
  const manifestPath = requireFromSuite.resolve('@reference-ui/core/package.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { bin: { ref: string } }
  return join(dirname(manifestPath), manifest.bin.ref)
}

/** Fresh `ref sync <project> --json`: stdout is exactly one JSON array of diagnostics. */
function syncJson(project: string): SyncRun {
  const projectDir = join(syncRoot, project)
  rmSync(join(projectDir, '.reference-ui'), { recursive: true, force: true })
  const run = spawnSync(process.execPath, [refBin(), 'sync', projectDir, '--json'], {
    encoding: 'utf8',
    timeout: SYNC_TIMEOUT_MS,
  })
  const line = run.stdout.split('\n').find((candidate) => candidate.trim().startsWith('['))
  if (run.status !== 0 || line === undefined) {
    throw new Error(
      `ref sync ${project} --json exited ${run.status} (${run.error?.message ?? 'no spawn error'})\n` +
        `stdout:\n${run.stdout}\nstderr:\n${run.stderr}`
    )
  }
  return { status: run.status, rows: JSON.parse(line) as DiagnosticRow[] }
}

/** 1-based line of the only source line containing `needle`. */
function lineOf(project: string, needle: string): number {
  const lines = readFileSync(join(syncRoot, project, 'src', 'icons.tsx'), 'utf8').split('\n')
  const hits = lines.flatMap((text, index) => (text.includes(needle) ? [index + 1] : []))
  if (hits.length !== 1) throw new Error(`expected one line with ${needle} in ${project}, found ${hits.length}`)
  return hits[0]
}

const unbackedRows = (run: SyncRun): DiagnosticRow[] => run.rows.filter((row) => row.code === UNBACKED_CODE)

describe('T18 icons composition: backed when composed, warned when not', () => {
  let backed: SyncRun
  let unbacked: SyncRun

  beforeAll(() => {
    backed = syncJson('backed')
    unbacked = syncJson('unbacked')
  }, SYNC_TIMEOUT_MS * 2)

  it('composed: the sheet backs the icon style prop under reference-icons', () => {
    const sheet = readFileSync(join(syncRoot, 'backed', '.reference-ui', 'react', 'styles.css'), 'utf8')
    expect(sheet).toMatch(/\.reference-icons__c_t18BackedInk(?![\w-])/)
  })

  it(`composed: nothing warns ${UNBACKED_CODE}`, () => {
    expect(backed.status).toBe(0)
    expect(unbackedRows(backed)).toEqual([])
  })

  it('uncomposed: sync still succeeds (the warning never refuses)', () => {
    expect(unbacked.status).toBe(0)
  })

  it(`uncomposed: the unstyled icon never draws ${UNBACKED_CODE}`, () => {
    const unstyledLine = lineOf('unbacked', '<CheckIcon />')
    expect(unbackedRows(unbacked).filter((row) => row.line === unstyledLine)).toEqual([])
  })

  const pending = EXTERNAL_UNBACKED_LANDED ? it : it.fails
  pending(`uncomposed: the styled icon warns ${UNBACKED_CODE} once, at its line, naming the package`, () => {
    const rows = unbackedRows(unbacked)
    expect(rows, `${UNBACKED_CODE} rows; every row: ${JSON.stringify(unbacked.rows)}`).toHaveLength(1)
    const [row] = rows
    expect(row.severity).toBe('warning')
    expect(row.file ?? '').toMatch(/icons\.tsx$/)
    expect(row.line).toBe(lineOf('unbacked', 'color="t18UnbackedInk"'))
    expect(row.message).toContain('@reference-ui/icons')
  })
})
