// unbacked.spec.ts — spec for CORE-CHAIN-16, the unbacked-package warning case. It takes { case } with the app world
// synced standalone by the runner. It syncs the package and another system for real, installs the package and a plain
// non-Reference package in world/node_modules, then runs two legs: nothing composed, and the other system composed in
// place of the package's. Each leg re-syncs through the real `sync()` and through the spawned `ref sync --json`, and
// checks both report one ATM-W-EXTERNAL-UNBACKED warning per styled package tag site, at that site's file and line,
// naming the package, its system and the baseSystem fix; nothing at the silent sites; and no class backing the package
// or the plain glyph in the sheet. Emits nothing on success; throws one line naming every broken claim on failure.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildWorld } from '../../../../shared/build.ts'
import type { CoreCase } from '../../../../shared/cases.ts'
import type { NativeDiagnostic } from '../../../../../src/native/contract.ts'
import { sync } from '../../../../../src/sync/index.ts'
import {
  canonicalConfig,
  installCopy,
  installPackage,
  restoreDir,
  syncUpstream,
  uninstallPackage,
  wireConfig,
  writeConfig,
  type UpstreamLink,
} from '../../shared/upstream.ts'

interface SpecInput {
  case: CoreCase
}

const BIN_PATH = fileURLToPath(new URL('../../../../../bin/ref.ts', import.meta.url))
const UNBACKED = 'ATM-W-EXTERNAL-UNBACKED'
const PACKAGE = '@fixture/chain16'
const PLAIN = 'plain-glyphs'
const OWN = 'core-chain16'
const UPSTREAM_NAME = 'core-chain16-up'
const OTHER_NAME = 'core-chain16-other'
const TAG = /style props on <([\w.]+)>/

const OTHER_LINK: UpstreamLink = { binding: 'otherBase', from: './other/.reference-ui/system/baseSystem.mjs' }

// The two compositions under test: nothing at all, then another system in place of the package's.
const LEGS: ReadonlyArray<{ name: string; extendsList: string[] }> = [
  { name: 'nothing composed', extendsList: [] },
  { name: `${OTHER_NAME} composed`, extendsList: [OTHER_LINK.binding] },
]

// Every styled package tag site, found by its marker text so the expected line follows the source. The unstyled
// `<Tile>`, the forwarding `<Button css={css}>` inside the wrapper, the own `Div` control and the plain `<Glyph>` have
// no row here: any warning at them is an extra row and fails the comparison.
const SITES: ReadonlyArray<{ file: string; marker: string; tag: string }> = [
  { file: 'src/direct.tsx', marker: '<Button color="chain16Ink"', tag: 'Button' },
  { file: 'src/direct.tsx', marker: '<Tile color="chain16Ink"', tag: 'Tile' },
  { file: 'src/barrel.tsx', marker: '<Button color="chain16Ink"', tag: 'Button' },
  { file: 'src/wrapper.tsx', marker: '<Wrap css=', tag: 'Wrap' },
]

// The plain package's use site: not a Reference component, so no row of any code may land in its file.
const GLYPH_FILE = 'src/glyph.tsx'

// Class stems in the served sheet and the only prefixes allowed to back them: the package probes' token is backed by
// the own control alone, never sprayed under a composed system, and the plain glyph's token backs no class at all.
const STEMS: ReadonlyArray<{ stem: string; prefixes: string[] }> = [
  { stem: 'c_chain16Ink', prefixes: [OWN] },
  { stem: 'c_chain16Glyph', prefixes: [] },
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

function relativeFile(worldDir: string, row: NativeDiagnostic): string {
  return row.file === undefined ? '(no file)' : path.relative(worldDir, path.resolve(worldDir, row.file))
}

// One unbacked row as `file:line <Tag>`, with the file relative to the world so the two channels compare as text.
function siteOf(worldDir: string, row: NativeDiagnostic): string {
  return `${relativeFile(worldDir, row)}:${row.line ?? '(no line)'} <${TAG.exec(row.message)?.[1] ?? '?'}>`
}

// A row is right when it is a warning whose message names the package and the system it renders through, and whose
// help gives the fix as composing the package's baseSystem, never registering the component in `jsxElements`.
function namesPackageAndFix(row: NativeDiagnostic): boolean {
  const help = (row.help ?? []).join(' ')
  const named = row.message.includes(`'${PACKAGE}'`) && row.message.includes(`'${UPSTREAM_NAME}'`)
  const fix = help.includes(`'${PACKAGE}/baseSystem'`) && help.includes('`extends`') && help.includes('`layers`')
  return row.severity === 'warning' && named && fix && !help.includes('jsxElements')
}

// Checks one channel's rows: the unbacked sites match exactly, each row names the package and the fix, and the plain
// package's file carries no row at all.
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
    broken.push(`${channel} row at ${siteOf(worldDir, row)} does not name ${PACKAGE}, ${UPSTREAM_NAME} and the fix: ${row.message} / ${help}`)
  }
  for (const row of rows.filter((entry) => relativeFile(worldDir, entry) === GLYPH_FILE)) {
    broken.push(`${channel} reports ${row.code} at the plain ${PLAIN} glyph: ${row.message}`)
  }
  return broken
}

// The prefixes the served sheet backs one class stem under, sorted and unique.
function prefixesOf(styles: string, stem: string): string[] {
  const found = [...styles.matchAll(new RegExp(`\\.([\\w-]+?)__${stem}\\b`, 'g'))].map((match) => match[1])
  return [...new Set(found)].sort()
}

// Nothing is sprayed: each stem is backed under exactly the prefixes it may be.
function sheetProblems(worldDir: string): string[] {
  const styles = fs.readFileSync(path.join(worldDir, '.reference-ui', 'styled', 'styles.css'), 'utf8')
  return STEMS.flatMap(({ stem, prefixes }) => {
    const actual = prefixesOf(styles, stem)
    if (JSON.stringify(actual) === JSON.stringify(prefixes)) return []
    return [`the sheet backs ${stem} under [${actual.join(', ')}], want [${prefixes.join(', ')}]`]
  })
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

// Syncs the package and the other system for real, builds both packages, and installs them: the Reference package
// linked as a workspace install, the plain one copied as a registry install. Returns the installs, for the finally.
async function installWorld(worldDir: string, installs: string[]): Promise<void> {
  const upstreamDir = path.join(worldDir, 'upstream')
  const plainDir = path.join(worldDir, 'plain')
  const upstream = await syncUpstream(upstreamDir)
  if (upstream.name !== UPSTREAM_NAME) throw new Error(`the package publishes ${upstream.name}, not ${UPSTREAM_NAME}`)
  const other = await syncUpstream(path.join(worldDir, 'other'))
  if (other.name !== OTHER_NAME) throw new Error(`the other system publishes ${other.name}, not ${OTHER_NAME}`)
  for (const dir of [upstreamDir, plainDir]) {
    const built = await buildWorld(dir)
    if ('error' in built) throw new Error(`${path.basename(dir)} does not build: ${built.error}`)
  }
  installs.push(installPackage(worldDir, PACKAGE, upstreamDir))
  installs.push(installCopy(worldDir, PLAIN, plainDir))
}

// One leg: write its composition, re-sync through both channels, and check the rows and the sheet.
async function legProblems(worldDir: string, canonical: string, leg: (typeof LEGS)[number]): Promise<string[]> {
  writeConfig(worldDir, leg.extendsList.length > 0 ? wireConfig(canonical, [OTHER_LINK], leg.extendsList) : canonical)
  // Sync never refuses over an unbacked package: a throw here fails the case with the sync's own message.
  const { diagnostics } = await sync(worldDir)
  const broken = [...channelProblems('sync()', worldDir, diagnostics), ...sheetProblems(worldDir)]
  const cli = cliRows(worldDir)
  if ('error' in cli) broken.push(cli.error)
  else broken.push(...channelProblems('ref sync --json', worldDir, cli.rows))
  return broken.map((problem) => `${leg.name}: ${problem}`)
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const canonical = canonicalConfig(c.worldDir)
  const installs: string[] = []
  try {
    await installWorld(c.worldDir, installs)
    const broken: string[] = []
    for (const leg of LEGS) broken.push(...(await legProblems(c.worldDir, canonical, leg)))
    if (broken.length > 0) throw new Error(`CORE-CHAIN-16 broke: ${broken.join('; ')}`)
  } finally {
    for (const install of installs) uninstallPackage(c.worldDir, install)
    await restoreDir(c.worldDir, canonical)
  }
}
