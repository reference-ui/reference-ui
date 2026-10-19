// monorepo.spec.ts — spec for CORE-CHAIN-17, the monorepo workspace case. It takes { page, url, case } with the root
// synced standalone. It builds the app and the package, links the package into the root's node_modules as `@acme/ui`,
// then runs three legs over the same tree: one system (the root sync spans the package's source), and the package
// synced as its own system and composed under extends, then under layers. Each leg re-syncs the root and checks its
// diagnostics, the sheet's backing for the probe class, and the computed paint, class and stamp of every probe. The
// link and the package's own system go and the canonical config is restored with a heal sync in a finally. Emits
// nothing on success; throws one line naming every wrong reading on failure.
import fs from 'node:fs'
import path from 'node:path'
import { buildWorld } from '../../../../shared/build.ts'
import type { CoreCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import { sync } from '../../../../../src/sync/index.ts'
import {
  canonicalConfig,
  installPackage,
  paintOf,
  restoreDir,
  syncUpstream,
  uninstallPackage,
  wireConfig,
  writeConfig,
  type UpstreamLink,
} from '../../shared/upstream.ts'

interface SpecInput {
  page: SpecPage
  url: string
  case: CoreCase
}

type Leg = 'one system' | 'extends' | 'layers'

/** One package-rendered probe's computed background, its class list and its data-layer stamp (null when unstamped). */
interface Reading {
  bg: string
  className: string
  stamp: string | null
}

// Playwright's console surface, narrowed to the one member this spec reads: a runtime class miss lands on
// console.warn as "no compiled class".
interface ConsoleMessage {
  text(): string
}
interface ConsolePage extends SpecPage {
  on(event: 'console', handler: (message: ConsoleMessage) => void): void
}

const OWN = 'core-chain17'
const UI = 'chain17-ui'
const PACKAGE = '@acme/ui'
const UNBACKED = 'ATM-W-EXTERNAL-UNBACKED'
const INK_STEM = 'bg_chain17Ink'

// The app imports the package's published system the way the unbacked warning tells it to: by its bare subpath.
const UI_LINK: UpstreamLink = { binding: 'uiBase', from: `${PACKAGE}/baseSystem` }

// Computed colours as the browser serialises them: the app's ink (#1d4ed8), and `shared` as the root defines it
// (#15803d) and as the package does (#be185d).
const INK = 'rgb(29, 78, 216)'
const ROOT_SHARED = 'rgb(21, 128, 61)'
const UI_SHARED = 'rgb(190, 24, 93)'

// What each leg must show. One system: the package is this sync's own source, so its tags back under the root's
// name and render the root's runtime. Composed: the package renders its own runtime, so its tags back under its
// system alone; `shared` takes the app's value under extends and the package's under layers (owner ruling, plan §11).
const EXPECT: Record<Leg, { page: string; prefix: string; stamp: string; shared: string }> = {
  'one system': { page: 'index.html', prefix: OWN, stamp: OWN, shared: ROOT_SHARED },
  extends: { page: 'two-systems.html', prefix: UI, stamp: UI, shared: ROOT_SHARED },
  layers: { page: 'two-systems.html', prefix: UI, stamp: UI, shared: UI_SHARED },
}

// The package-rendered probes, by data-testid: the background each must compute in a leg, and the class stem it
// must carry under the leg's prefix.
const PROBES: ReadonlyArray<{ shape: string; testId: string; stem: string; bg: (leg: Leg) => string }> = [
  { shape: 'Card bg', testId: 'chain17-card', stem: INK_STEM, bg: () => INK },
  { shape: 'css wrapper Card', testId: 'chain17-panel', stem: INK_STEM, bg: () => INK },
  { shape: 'Card bg="shared"', testId: 'chain17-shared', stem: 'bg_shared', bg: (leg) => EXPECT[leg].shared },
]

function uiDirOf(worldDir: string): string {
  return path.join(worldDir, 'packages', 'ui')
}

// The package's own sync output: gone, the package has no system and the root sync spans it as plain source.
function dropUiSystem(worldDir: string): void {
  for (const generated of ['.reference-ui', 'node_modules']) {
    fs.rmSync(path.join(uiDirOf(worldDir), generated), { force: true, recursive: true })
  }
}

// Both workspaces build their src/ to dist/, the files the pages load; a failure is a fixture fault.
async function buildWorkspaces(worldDir: string): Promise<void> {
  for (const dir of [path.join(worldDir, 'apps', 'web'), uiDirOf(worldDir)]) {
    const built = await buildWorld(dir)
    if ('error' in built) throw new Error(`${path.relative(worldDir, dir)} does not build: ${built.error}`)
  }
}

function configFor(canonical: string, leg: Leg): string {
  if (leg === 'one system') return canonical
  if (leg === 'extends') return wireConfig(canonical, [UI_LINK], [UI_LINK.binding])
  return wireConfig(canonical, [UI_LINK], [], [UI_LINK.binding])
}

// The prefixes the served sheet backs one class stem under, sorted and unique.
function prefixesOf(worldDir: string, stem: string): string[] {
  const styles = fs.readFileSync(path.join(worldDir, '.reference-ui', 'styled', 'styles.css'), 'utf8')
  const found = [...styles.matchAll(new RegExp(`\\.([\\w-]+?)__${stem}\\b`, 'g'))].map((match) => match[1])
  return [...new Set(found)].sort()
}

async function read(page: SpecPage, testId: string): Promise<Reading> {
  const node = page.locator(`[data-testid="${testId}"]`)
  await node.waitFor()
  return node.evaluate((el) => ({
    bg: getComputedStyle(el).backgroundColor,
    className: el.className,
    stamp: el.getAttribute('data-layer'),
  }))
}

// One probe's problems in a leg: its paint, the class it carries, and the runtime that stamped it.
function probeProblems(probe: (typeof PROBES)[number], reading: Reading, leg: Leg): string[] {
  const want = EXPECT[leg]
  const broken: string[] = []
  const at = `${probe.shape} (class ${reading.className}, data-layer ${reading.stamp})`
  if (reading.bg !== probe.bg(leg)) broken.push(`${at} paints ${reading.bg}, want ${probe.bg(leg)}`)
  if (!reading.className.split(' ').includes(`${want.prefix}__${probe.stem}`)) {
    broken.push(`${at} does not carry ${want.prefix}__${probe.stem}`)
  }
  if (reading.stamp !== want.stamp) broken.push(`${at} is stamped ${reading.stamp}, want ${want.stamp}`)
  return broken
}

// One leg: write its config, re-sync the root, then check the diagnostics, the sheet and the page.
async function legProblems(input: SpecInput, canonical: string, leg: Leg): Promise<string[]> {
  const { page, url, case: c } = input
  writeConfig(c.worldDir, configFor(canonical, leg))
  const { diagnostics } = await sync(c.worldDir)
  const broken = diagnostics
    .filter((row) => row.code === UNBACKED)
    .map((row) => `${UNBACKED} at ${row.file}:${row.line}: ${row.message}`)
  const prefixes = prefixesOf(c.worldDir, INK_STEM)
  if (JSON.stringify(prefixes) !== JSON.stringify([EXPECT[leg].prefix])) {
    broken.push(`the sheet backs ${INK_STEM} under [${prefixes.join(', ')}], want [${EXPECT[leg].prefix}]`)
  }
  await page.goto(`${url}${EXPECT[leg].page}?leg=${encodeURIComponent(leg)}`, { waitUntil: 'load' })
  // Positive control: the ink paints in the app's own scope, so a failing Card is an ownership miss.
  const local = await paintOf(page, 'chain17-local')
  if (local !== INK) broken.push(`the local Div control paints ${local}, so token resolution is suspect`)
  for (const probe of PROBES) broken.push(...probeProblems(probe, await read(page, probe.testId), leg))
  return broken.map((problem) => `${leg}: ${problem}`)
}

export default async function run(input: SpecInput): Promise<void> {
  const { page, case: c } = input
  const canonical = canonicalConfig(c.worldDir)
  const misses: string[] = []
  ;(page as unknown as ConsolePage).on('console', (message) => {
    if (message.text().includes('no compiled class')) misses.push(message.text())
  })

  let installed: string | undefined
  try {
    dropUiSystem(c.worldDir)
    await buildWorkspaces(c.worldDir)
    installed = installPackage(c.worldDir, PACKAGE, uiDirOf(c.worldDir))
    const broken = await legProblems(input, canonical, 'one system')

    const ui = await syncUpstream(uiDirOf(c.worldDir))
    if (ui.name !== UI) broken.push(`the package publishes ${ui.name}, not ${UI}`)
    broken.push(...(await legProblems(input, canonical, 'extends')))
    broken.push(...(await legProblems(input, canonical, 'layers')))

    if (misses.length > 0) broken.push(`${misses.length} runtime miss(es), first: ${misses[0]}`)
    if (broken.length > 0) throw new Error(`CORE-CHAIN-17 broke: ${broken.join('; ')}`)
  } finally {
    if (installed) uninstallPackage(c.worldDir, installed)
    dropUiSystem(c.worldDir)
    await restoreDir(c.worldDir, canonical)
  }
}
