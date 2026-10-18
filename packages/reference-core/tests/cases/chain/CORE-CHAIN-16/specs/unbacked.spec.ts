// unbacked.spec.ts — spec for CORE-CHAIN-16, the unbacked-package warning case. It takes { case } with the app world
// synced standalone by the runner (nothing in `extends` or `layers`). It re-syncs through the real `sync()` and through
// the spawned `ref sync --json`, and checks both report one ATM-W-EXTERNAL-UNBACKED warning per styled package tag site,
// at that site's file and line, naming the package and the extends/layers fix, and nothing for the silent sites.
// Emits nothing on success; throws one line naming every broken claim on failure.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CoreCase } from '../../../../shared/cases.ts'
import type { NativeDiagnostic } from '../../../../../src/native/contract.ts'
import { sync } from '../../../../../src/sync/index.ts'

interface SpecInput {
  case: CoreCase
}

const BIN_PATH = fileURLToPath(new URL('../../../../../bin/ref.ts', import.meta.url))
const UNBACKED = 'ATM-W-EXTERNAL-UNBACKED'
const PACKAGE = "'@fixture/chain16'"
const TAG = /style props on <([\w.]+)>/

// Every styled package tag site, found by its marker text so the expected line follows the source. The unstyled
// `<Tile>`, the forwarding `<Button css={css}>` inside the wrapper and the own `Div` control have no row here: any
// warning at them is an extra row and fails the comparison.
const SITES: ReadonlyArray<{ file: string; marker: string; tag: string }> = [
  { file: 'src/direct.tsx', marker: '<Button color="chain16Ink"', tag: 'Button' },
  { file: 'src/direct.tsx', marker: '<Tile color="chain16Ink"', tag: 'Tile' },
  { file: 'src/barrel.tsx', marker: '<Button color="chain16Ink"', tag: 'Button' },
  { file: 'src/wrapper.tsx', marker: '<Wrap css=', tag: 'Wrap' },
]

// The 1-based line holding the marker; a count other than one means the world changed shape.
function lineOf(worldDir: string, file: string, marker: string): number {
  const lines = fs.readFileSync(path.join(worldDir, file), 'utf8').split('\n')
  const hits = lines.flatMap((text, index) => (text.includes(marker) ? [index + 1] : []))
  if (hits.length !== 1) throw new Error(`${file} must hold ${JSON.stringify(marker)} on exactly one line`)
  return hits[0]
}

function expectedSites(worldDir: string): string[] {
  return SITES.map((site) => `${site.file}:${lineOf(worldDir, site.file, site.marker)} <${site.tag}>`).sort()
}

// One unbacked row as `file:line <Tag>`, with the file relative to the world so the two channels compare as text.
function siteOf(worldDir: string, row: NativeDiagnostic): string {
  const file = row.file === undefined ? '(no file)' : path.relative(worldDir, path.resolve(worldDir, row.file))
  return `${file}:${row.line ?? '(no line)'} <${TAG.exec(row.message)?.[1] ?? '?'}>`
}

// A row is right when it is a warning whose message and help name the package, and whose fix is composing the
// package's base system, never registering the component in `jsxElements`.
function namesPackageAndFix(row: NativeDiagnostic): boolean {
  const help = (row.help ?? []).join(' ')
  const named = row.message.includes(PACKAGE) && help.includes(PACKAGE)
  return row.severity === 'warning' && named && help.includes('`extends`') && !help.includes('jsxElements')
}

// Checks one channel's rows: the unbacked sites match exactly, and each row is a warning naming the package and the fix.
function channelProblems(channel: string, worldDir: string, rows: NativeDiagnostic[]): string[] {
  const broken: string[] = []
  const unbacked = rows.filter((row) => row.code === UNBACKED)
  const actual = unbacked.map((row) => siteOf(worldDir, row)).sort()
  const expected = expectedSites(worldDir)
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    broken.push(`${channel} reports ${UNBACKED} at [${actual.join(', ')}], want [${expected.join(', ')}]`)
  }
  for (const row of unbacked.filter((entry) => !namesPackageAndFix(entry))) {
    const help = (row.help ?? []).join(' ')
    broken.push(`${channel} row at ${siteOf(worldDir, row)} does not name ${PACKAGE} and the extends fix: ${row.message} / ${help}`)
  }
  return broken
}

// The spawned CLI: it must exit 0 and print the diagnostics array as its last stdout line.
function cliRows(worldDir: string): { rows: NativeDiagnostic[] } | { error: string } {
  const result = spawnSync(process.execPath, [BIN_PATH, 'sync', '--json', worldDir], {
    cwd: worldDir,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: undefined },
  })
  if (result.status !== 0) return { error: `ref sync --json exits ${result.status}: ${result.stdout}${result.stderr}` }
  const last = result.stdout.trim().split('\n').at(-1) ?? ''
  try {
    return { rows: JSON.parse(last) as NativeDiagnostic[] }
  } catch {
    return { error: `ref sync --json printed no diagnostics array: ${result.stdout}` }
  }
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  // Sync never refuses over an unbacked package: a throw here fails the case with the sync's own message.
  const { diagnostics } = await sync(c.worldDir)
  const broken = channelProblems('sync()', c.worldDir, diagnostics)

  const cli = cliRows(c.worldDir)
  if ('error' in cli) broken.push(cli.error)
  else broken.push(...channelProblems('ref sync --json', c.worldDir, cli.rows))

  if (broken.length > 0) throw new Error(`CORE-CHAIN-16 broke: ${broken.join('; ')}`)
}
