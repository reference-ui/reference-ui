// branded-layer.spec.ts — spec for NEO-LAYERS-17, an extendSystem override of a layered upstream's token. It takes
// { page, url, case } with the world synced standalone. It syncs the up upstream for real, copies its published react
// entry beside the world, rewrites the world config to list brandUp(upBaseSystem) under layers, then reads the
// published stream, the served sheet and each leg's paint. It also edits up.ts and re-syncs, so the paint must follow
// the module. The canonical up.ts and config are restored in a finally. Emits nothing on success; throws on failure.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import type { NeoCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import { sync } from '../../../../../src/sync/index.ts'
import { configPathOf, readPublished, readSheet, restoreWorld, writeConfig } from '../../shared/upstream.ts'

interface SpecInput {
  page: SpecPage
  url: string
  case: NeoCase
}

/** One computed read of an upstream probe: the data-layer it stamps and the colour it paints. */
interface Probe {
  layer: string | null
  color: string
}

/** One page load: the html colour mode, the consumer root's stamp, and the two upstream probes. */
interface Reading {
  htmlMode: string | null
  root: string | null
  ink: Probe
  soft: Probe
}

interface Leg {
  label: string
  query: string
  htmlMode: string | null
  ink: string
  soft: string
}

/** Everything the edit step and the restore need, gathered once so each helper takes one argument. */
interface WorldRun {
  worldDir: string
  page: SpecPage
  url: string
  upReact: string
  modulePath: string
  canonicalModule: string
}

const OWN = 'neo-layers17'
const UP = 'neo-layers17-up'
const CONFIG_IMPORT = "import { defineConfig } from '@reference-ui/neo'"
const EMPTY_EXTENDS = 'extends: [],'
const UP_IMPORT_LINES = [
  "import { baseSystem as upBaseSystem } from '../upstreams/up/.reference-ui/system/baseSystem.mjs'",
  "import { brandUp } from './src/system/up'",
  'const brandedUp = brandUp(upBaseSystem)',
].join('\n')

// The override values as up.ts spells them. upInk's light and dark values replace upstream's; upSoft's light-only
// value must also replace upstream's own dark value, so dark mode shows SOFT too.
const INK_LIGHT_HEX = '#0f766e'
const INK_DARK_HEX = '#5eead4'
const SOFT_HEX = '#0d9488'
const EDITED_INK_HEX = '#115e59'
// The same values as getComputedStyle reports them.
const INK_LIGHT = 'rgb(15, 118, 110)'
const INK_DARK = 'rgb(94, 234, 212)'
const SOFT = 'rgb(13, 148, 136)'
const EDITED_INK = 'rgb(17, 94, 89)'

// The override block the consumer's published upstream stream ends with: a light rule on the stamps, then a dark rule
// that carries upInk's dark value and upSoft's light value, because upSoft's own base prints a dark value.
const OVERRIDE_BLOCK = [
  '@layer tokens {',
  `  [data-layer="${UP}"], [data-layer="${UP}"][data-color-mode=light] {`,
  `    --colors-up-ink: ${INK_LIGHT_HEX};`,
  `    --colors-up-soft: ${SOFT_HEX};`,
  '  }',
  `  [data-layer="${UP}"][data-color-mode=dark] {`,
  `    --colors-up-ink: ${INK_DARK_HEX};`,
  `    --colors-up-soft: ${SOFT_HEX};`,
  '  }',
  '}',
  '',
].join('\n')

// Three legs, one page load each. The query string sets html data-color-mode before the first render.
const LEGS: readonly Leg[] = [
  { label: 'no html data-color-mode', query: '', htmlMode: null, ink: INK_LIGHT, soft: SOFT },
  { label: 'html data-color-mode="light"', query: '?mode=light', htmlMode: 'light', ink: INK_LIGHT, soft: SOFT },
  { label: 'html data-color-mode="dark" (dark mode)', query: '?mode=dark', htmlMode: 'dark', ink: INK_DARK, soft: SOFT },
]

// The one line of up.ts that holds upInk's override, exactly as the module spells it.
const INK_OVERRIDE_LINE = `        upInk: { value: '${INK_LIGHT_HEX}', dark: '${INK_DARK_HEX}' },`

// Lists the branded upstream under layers; a missing anchor means the canonical config changed shape.
function toBrandedConfig(canonical: string): string {
  const withImports = canonical.replace(CONFIG_IMPORT, `${CONFIG_IMPORT}\n${UP_IMPORT_LINES}`)
  if (withImports === canonical) throw new Error('canonical ui.config lost its neo import')
  const layered = withImports.replace(EMPTY_EXTENDS, 'extends: [],\n  layers: [brandedUp],')
  if (layered === withImports) throw new Error('canonical ui.config lost its empty extends')
  return layered
}

// The module with upInk's light value edited; a missing anchor means the module changed shape.
function editedModule(canonical: string): string {
  const edited = `        upInk: { value: '${EDITED_INK_HEX}', dark: '${INK_DARK_HEX}' },`
  const next = canonical.replace(INK_OVERRIDE_LINE, edited)
  if (next === canonical) throw new Error('canonical up.ts lost its upInk override')
  return next
}

// The upstream's published react entry, copied where the page's importmap points. It is copied again after every
// world sync, so the page always loads the copy that the latest sync's upstream produced.
function copyUpstreamEntry(worldDir: string, source: string): void {
  const target = path.join(worldDir, '.reference-ui', 'upstream', 'react.mjs')
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.copyFileSync(source, target)
}

async function syncWorld(ctx: WorldRun): Promise<void> {
  await sync(ctx.worldDir)
  copyUpstreamEntry(ctx.worldDir, ctx.upReact)
}

// One computed read of the upstream probe with this id: the data-layer it stamps and the colour it paints.
async function probeOf(page: SpecPage, id: string): Promise<Probe> {
  return page.locator(`#${id}`).evaluate((el) => ({
    layer: el.getAttribute('data-layer'),
    color: getComputedStyle(el).color,
  }))
}

// One page read: the html mode, the consumer root's stamp, and the two upstream probes, all from one page state.
async function readLeg(page: SpecPage): Promise<Reading> {
  await page.locator('#consumer-root').waitFor()
  const htmlMode = await page.locator('html').evaluate((el) => el.getAttribute('data-color-mode'))
  const root = await page.locator('#consumer-root').evaluate((el) => el.getAttribute('data-layer'))
  return { htmlMode, root, ink: await probeOf(page, 'up-ink'), soft: await probeOf(page, 'up-soft') }
}

// Each probe keeps the upstream's data-layer, and paints the override: light shows the light value, dark shows upInk's
// dark value, and upSoft's light-only override beats the upstream's own dark value in every mode.
function assertLeg(reading: Reading, leg: Leg): void {
  assert.equal(reading.htmlMode, leg.htmlMode, `${leg.label}: html carries the leg's colour mode`)
  assert.equal(reading.root, OWN, `${leg.label}: the consumer root stamps ${OWN}, got ${reading.root}`)
  assert.equal(reading.ink.layer, UP, `${leg.label}: upInk's probe keeps data-layer ${UP}, got ${reading.ink.layer}`)
  assert.equal(reading.soft.layer, UP, `${leg.label}: upSoft's probe keeps data-layer ${UP}, got ${reading.soft.layer}`)
  assert.equal(reading.ink.color, leg.ink, `${leg.label}: upInk paints the override, got ${reading.ink.color}`)
  assert.equal(reading.soft.color, leg.soft, `${leg.label}: upSoft paints the light-only override, got ${reading.soft.color}`)
}

// The served sheet carries the upstream's layer block, so its rules ride the consumer's own stylesheet.
function assertSheet(worldDir: string): void {
  assert.ok(readSheet(worldDir).includes(`@layer ${UP} {`), `the served sheet carries the @layer ${UP} block`)
}

// The consumer's published system carries the upstream's stream entry, and that entry ends with the override block.
function assertPublished(worldDir: string): void {
  const entry = readPublished(worldDir).streams?.find((stream) => stream.name === UP)
  assert.ok(entry, `the published system carries the ${UP} stream entry`)
  assert.ok(
    (entry.tokensPortable ?? '').endsWith(OVERRIDE_BLOCK),
    'the upstream stream entry ends with the extendSystem override block',
  )
}

// Editing up.ts and re-syncing must change the paint on the next load; upSoft's light-only override keeps painting.
async function proveEdit(ctx: WorldRun): Promise<void> {
  fs.writeFileSync(ctx.modulePath, editedModule(ctx.canonicalModule), 'utf8')
  await syncWorld(ctx)
  await ctx.page.goto(ctx.url, { waitUntil: 'load' })
  const reading = await readLeg(ctx.page)
  assert.equal(reading.ink.color, EDITED_INK, `an edited upInk paints after a re-sync, got ${reading.ink.color}`)
  assert.equal(reading.soft.color, SOFT, `upSoft keeps its light-only override after the edit, got ${reading.soft.color}`)
}

// Syncs the upstream for real, lists the branded layer, then proves the published block, the sheet, each leg and the
// edit. The canonical module and config come back in a finally, with a resync, whatever the run did.
export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  const canonical = fs.readFileSync(configPathOf(c.worldDir), 'utf8')
  const modulePath = path.join(c.worldDir, 'src', 'system', 'up.ts')
  const canonicalModule = fs.readFileSync(modulePath, 'utf8')
  const upDir = path.join(c.dir, 'upstreams', 'up')
  const upReact = path.join(upDir, '.reference-ui', 'react', 'react.mjs')
  const ctx: WorldRun = { worldDir: c.worldDir, page, url, upReact, modulePath, canonicalModule }
  try {
    await sync(upDir)
    assert.ok(fs.readFileSync(upReact, 'utf8').includes(UP), `the upstream publishes a react entry bound to ${UP}`)
    writeConfig(c.worldDir, toBrandedConfig(canonical))
    await syncWorld(ctx)
    assertSheet(c.worldDir)
    assertPublished(c.worldDir)
    for (const leg of LEGS) {
      await page.goto(`${url}${leg.query}`, { waitUntil: 'load' })
      assertLeg(await readLeg(page), leg)
    }
    await proveEdit(ctx)
  } finally {
    fs.writeFileSync(modulePath, canonicalModule, 'utf8')
    await restoreWorld(c.worldDir, canonical)
  }
}
