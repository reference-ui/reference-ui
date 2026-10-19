import { spawnSync } from 'node:child_process'
import { readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'

/**
 * T18 composition legs. A warning is a sync output, so each leg is its own
 * tiny project under `tests/sync/`, synced here with the installed
 * `ref sync <dir> --json`.
 *
 * Icons (component-ownership plan §9.5): a style prop on an
 * `@reference-ui/icons` icon is backed when the icons baseSystem is composed,
 * and warns `ATM-W-EXTERNAL-UNBACKED` when it is not.
 *
 * - `backed/` layers `@reference-ui/icons/baseSystem`: the sheet backs
 *   `.reference-icons__c_t18BackedInk` and nothing warns.
 * - `unbacked/` composes nothing: one warning at the styled icon's line,
 *   naming `@reference-ui/icons`; the unstyled icon stays silent.
 *
 * Partly composed (styling-across-packages plan gap 2, S6): `partial/`
 * extends lib but not the fixture. Each styled fixture tag warns once, naming
 * the package, its system and the `<package>/baseSystem` fix, and its props
 * back under no prefix at all: before S2 they were sprayed under lib's
 * systems, a class the fixture's runtime never mints, and nothing warned.
 * The lib tag beside them is the control: backed under lib's systems.
 *
 * The browser halves (an icon paints when composed; the fully composed app
 * backs each probe only under its renderer's systems) are the T18 contract.
 *
 * The warning has landed (plan S3, on top of S1), so
 * `EXTERNAL_UNBACKED_LANDED` is true. Before it, the uncomposed icon was
 * dropped silently (plan probe 4); setting the flag back to false marks that
 * test `it.fails` again, and vitest fails a marked test that passes.
 */
const EXTERNAL_UNBACKED_LANDED = true
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
  help?: string[]
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

/** 1-based line of the only line of `src/<file>` containing `needle`. */
function lineOf(project: string, needle: string, file = 'icons.tsx'): number {
  const lines = readFileSync(join(syncRoot, project, 'src', file), 'utf8').split('\n')
  const hits = lines.flatMap((text, index) => (text.includes(needle) ? [index + 1] : []))
  if (hits.length !== 1) throw new Error(`expected one line with ${needle} in ${project}, found ${hits.length}`)
  return hits[0]
}

const unbackedRows = (run: SyncRun): DiagnosticRow[] => run.rows.filter((row) => row.code === UNBACKED_CODE)

/** The generated sheet of a synced leg. */
function sheetOf(project: string): string {
  return readFileSync(join(syncRoot, project, '.reference-ui', 'react', 'styles.css'), 'utf8')
}

/** Every system-qualified class the sheet backs for `stem`, e.g. `['reference-ui__c_x']`. */
function backedClasses(sheet: string, stem: string): string[] {
  const pattern = new RegExp(`\\.([A-Za-z0-9-]+__${stem})(?![\\w-])`, 'g')
  return [...new Set([...sheet.matchAll(pattern)].map((match) => match[1]))].sort()
}

describe('T18 icons composition: backed when composed, warned when not', () => {
  let backed: SyncRun
  let unbacked: SyncRun

  beforeAll(() => {
    backed = syncJson('backed')
    unbacked = syncJson('unbacked')
  }, SYNC_TIMEOUT_MS * 2)

  it('composed: the sheet backs the icon style prop under reference-icons', () => {
    const sheet = sheetOf('backed')
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

describe('T18 partly composed: lib extended, the fixture not', () => {
  const FIXTURE_PACKAGE = '@fixtures/primitive-named-library'
  const FIXTURE_SYSTEM = 'primitive-named-library'
  const PARTIAL_FILE = 'partial.tsx'
  /** The fixture's styled tags, each with the stem its props would mint. */
  const FIXTURE_TAGS = [
    { tag: 'Tile', needle: 'padding="t18PartialTileGap"', stem: 'p_t18PartialTileGap' },
    { tag: 'AcmeButton', needle: 'color="t18PartialAcmeInk"', stem: 'c_t18PartialAcmeInk' },
  ] as const
  const LIB_STEM = 'c_t18PartialLibInk'

  let partial: SyncRun
  let sheet: string

  beforeAll(() => {
    partial = syncJson('partial')
    sheet = sheetOf('partial')
  }, SYNC_TIMEOUT_MS)

  it('sync succeeds and warns only for the fixture tags (the warning never refuses)', () => {
    expect(partial.status).toBe(0)
    const warnings = partial.rows.filter((row) => row.severity === 'warning' || row.severity === 'error')
    expect(warnings.map((row) => row.code), JSON.stringify(partial.rows)).toEqual(FIXTURE_TAGS.map(() => UNBACKED_CODE))
  })

  for (const { tag, needle } of FIXTURE_TAGS) {
    it(`<${tag}> warns ${UNBACKED_CODE} once, at its line, naming the package, its system and the fix`, () => {
      const line = lineOf('partial', needle, PARTIAL_FILE)
      const rows = unbackedRows(partial).filter((row) => row.line === line)
      expect(rows, `${UNBACKED_CODE} rows at line ${line}; every row: ${JSON.stringify(partial.rows)}`).toHaveLength(1)
      const [row] = rows
      expect(row.severity).toBe('warning')
      expect(row.file ?? '').toMatch(/partial\.tsx$/)
      expect(row.message).toContain(`<${tag}>`)
      expect(row.message).toContain(`'${FIXTURE_PACKAGE}'`)
      expect(row.message).toContain(`'${FIXTURE_SYSTEM}'`)
      expect((row.help ?? []).join('\n')).toContain(`${FIXTURE_PACKAGE}/baseSystem`)
    })
  }

  it(`the lib tag draws no ${UNBACKED_CODE}`, () => {
    const libLine = lineOf('partial', 'color="t18PartialLibInk"', PARTIAL_FILE)
    expect(unbackedRows(partial).filter((row) => row.line === libLine)).toEqual([])
  })

  for (const { tag, stem } of FIXTURE_TAGS) {
    it(`no spray: <${tag}>'s ${stem} backs under no prefix, not lib's, not the app's`, () => {
      expect(backedClasses(sheet, stem)).toEqual([])
    })
  }

  it('the fixture tokens still compile, so only the backing is missing', () => {
    expect(sheet).toContain('--colors-t18-partial-acme-ink:')
    expect(sheet).toContain('--spacing-t18-partial-tile-gap:')
  })

  it("control: the lib tag backs under lib's systems and nowhere else", () => {
    const backed = backedClasses(sheet, LIB_STEM)
    expect(backed).toContain(`reference-ui__${LIB_STEM}`)
    expect(backed.filter((name) => !/^reference-(ui|icons)__/.test(name))).toEqual([])
  })
})
