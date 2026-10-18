// misuse.spec.ts — spec for NEO-LAYERS-18, extendSystem misuse at a real ref sync. It takes { page, url, case }
// with the world synced by the runner, syncs the base upstream for real, then rewrites the world config once
// per leg. Each misuse exits 1 through the spawned bin with its named message and leaves the published world
// system untouched. Then three valid shapes sync in-process: two layers paint their overrides in light and dark
// (a light-only override of a token the base darkens, and an explicit dark leaf), and an extends entry publishes
// its fragment node and merges its tokens. The canonical world config is restored with a resync in a finally.
// Emits nothing on success; throws on failure.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NeoCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import { sync } from '../../../../../src/sync/index.ts'
import { configPathOf, restoreWorld, writeConfig } from '../../shared/upstream.ts'

interface SpecInput {
  page: SpecPage
  url: string
  case: NeoCase
}

/** One world config spelling: the lines after the defineConfig import, and the fields in place of the empty extends. */
interface Wiring {
  imports: string[]
  fields: string
}

interface Leg extends Wiring {
  label: string
  message: string
}

interface PublishedStream {
  name: string
  tokensPortable?: string
}

interface PublishedSystem {
  name: string
  fragments?: Array<{ name: string; bundle: string }>
  streams?: PublishedStream[]
}

interface TokenLeaf {
  value?: string
  dark?: string
}

interface EvaluatedTokens {
  tokens: { colors: { brandInk: TokenLeaf; brandAccent: TokenLeaf } }
}

/** The three base tokens as one stamp paints them. */
interface Paint {
  ink: string
  soft: string
  accent: string
}

const BIN_PATH = fileURLToPath(new URL('../../../../../bin/ref.ts', import.meta.url))
const CONFIG_IMPORT = "import { defineConfig } from '@reference-ui/neo'"
const EXTEND_IMPORT = "import { extendSystem } from '@reference-ui/neo'"
const EMPTY_EXTENDS = 'extends: [],'
const BASE_IMPORT = "import { baseSystem as base } from '../upstreams/base/.reference-ui/system/baseSystem.mjs'"
const BASE_NAME = 'neo-layers18-base'
const LAYERS_HEADER = "Config field 'layers' is invalid."
const QUOTED_NAME = 'neo-layers18"base'

// The base's own values, which a token the override leaves alone keeps in every mode.
const BASE_INK_LIGHT = '#1f2937'
const BASE_INK_DARK = '#e5e7eb'
const BASE_SOFT = '#e5e7eb'
const BASE_ACCENT_LIGHT = '#0d9488'
const BASE_ACCENT_DARK = '#5eead4'
// The override values. brandInk and brandSoft are light-only; brandAccent is the explicit-dark leaf.
const INK = '#0f766e'
const SOFT = '#ffffff'
const ACCENT_LIGHT = '#115e59'
const ACCENT_DARK = '#99f6e4'

// A light-only override of a token the base darkens (brandInk) and of a token it does not (brandSoft).
const CONFLICT = [
  'const conflict = extendSystem(base, { tokens: { colors: {',
  `  brandInk: { value: '${INK}' },`,
  `  brandSoft: { value: '${SOFT}' },`,
  '} } })',
].join('\n')

// One leaf with its own dark value.
const DARK_LEAF = [
  'const darkLeaf = extendSystem(base, { tokens: { colors: {',
  `  brandAccent: { value: '${ACCENT_LIGHT}', dark: '${ACCENT_DARK}' },`,
  '} } })',
].join('\n')

// All three overrides at once, for the misuse legs and the extends shape.
const BRANDED = [
  'const branded = extendSystem(base, { tokens: { colors: {',
  `  brandInk: { value: '${INK}' },`,
  `  brandSoft: { value: '${SOFT}' },`,
  `  brandAccent: { value: '${ACCENT_LIGHT}', dark: '${ACCENT_DARK}' },`,
  '} } })',
].join('\n')

// Each misuse, the lines it adds to the world config, and the message it must print.
const LEGS: Leg[] = [
  {
    label: 'unknown token',
    imports: [
      EXTEND_IMPORT,
      BASE_IMPORT,
      "const branded = extendSystem(base, { tokens: { colors: { brandMissing: { value: '#fff' } } } })",
    ],
    fields: 'extends: [],\n  layers: [branded],',
    message: `extendSystem: unknown token colors.brandMissing in ${BASE_NAME}; only tokens the base declares can be overridden.`,
  },
  {
    label: 'base and its extension in one field',
    imports: [EXTEND_IMPORT, BASE_IMPORT, BRANDED],
    fields: 'extends: [],\n  layers: [base, branded],',
    message: `${LAYERS_HEADER}\nEntry 1 (${BASE_NAME}) repeats entry 0. List each system once.`,
  },
  {
    label: 'name with a quote',
    imports: [EXTEND_IMPORT, BASE_IMPORT, BRANDED],
    fields: `extends: [],\n  layers: [{ ...branded, name: '${QUOTED_NAME}' }],`,
    message: `${LAYERS_HEADER}\nEntry 0 (${JSON.stringify(QUOTED_NAME)}) has a name with a double quote, a backslash or a line break, which a [data-layer] selector cannot carry.`,
  },
]

const CONFLICT_SHAPE: Wiring = {
  imports: [EXTEND_IMPORT, BASE_IMPORT, CONFLICT],
  fields: 'extends: [],\n  layers: [conflict],',
}

const DARK_LEAF_SHAPE: Wiring = {
  imports: [EXTEND_IMPORT, BASE_IMPORT, DARK_LEAF],
  fields: 'extends: [],\n  layers: [darkLeaf],',
}

const EXTENDS_SHAPE: Wiring = {
  imports: [EXTEND_IMPORT, BASE_IMPORT, BRANDED],
  fields: 'extends: [branded],',
}

// Swaps one anchor for its replacement; a count other than one means the canonical config changed shape.
function swapOnce(text: string, anchor: string, replacement: string): string {
  if (text.split(anchor).length !== 2) {
    throw new Error(`canonical ui.config must hold ${JSON.stringify(anchor)} exactly once`)
  }
  return text.replace(anchor, () => replacement)
}

// The canonical config with one wiring spliced in: its lines after the defineConfig import, its fields in place of the empty extends.
function legConfig(canonical: string, wiring: Wiring): string {
  const withImports = swapOnce(canonical, CONFIG_IMPORT, [CONFIG_IMPORT, ...wiring.imports].join('\n'))
  return swapOnce(withImports, EMPTY_EXTENDS, wiring.fields)
}

function count(text: string, needle: string): number {
  return text.split(needle).length - 1
}

function readPublishedText(root: string): string {
  return fs.readFileSync(path.join(root, '.reference-ui', 'system', 'baseSystem.mjs'), 'utf8')
}

function readPublished(root: string): PublishedSystem {
  const raw = readPublishedText(root)
  return JSON.parse(raw.slice(raw.indexOf('{'))) as PublishedSystem
}

// The published token block of the base's own stream entry, as the layer prints it.
function ownTokensOf(root: string): string {
  return readPublished(root).streams?.find((stream) => stream.name === BASE_NAME)?.tokensPortable ?? ''
}

function runBin(dir: string) {
  return spawnSync(process.execPath, [BIN_PATH, 'sync', dir], { cwd: dir, encoding: 'utf8' })
}

// Syncs the base upstream for real, so the world config can import its published system.
async function syncBase(c: NeoCase): Promise<void> {
  const dir = path.join(c.dir, 'upstreams', 'base')
  await sync(dir)
  assert.equal(readPublished(dir).name, BASE_NAME, 'the base upstream publishes its name')
}

// A rejected misuse exits 1 with its named message and leaves the published world system untouched.
function proveRejects(worldDir: string, leg: Leg, publishedBefore: string): void {
  const result = runBin(worldDir)
  assert.equal(result.status, 1, `${leg.label} exits 1`)
  assert.ok(
    result.stdout.includes(leg.message),
    `${leg.label} prints its named message, got: ${result.stdout}`
  )
  assert.equal(
    readPublishedText(worldDir),
    publishedBefore,
    `${leg.label} leaves the published system untouched`
  )
}

// The three base tokens as the stamp with this id paints them, read in the page itself.
async function paintOf(page: SpecPage, stamp: string): Promise<Paint> {
  return page.locator(`#${stamp}`).evaluate((el) => ({
    ink: getComputedStyle(el).getPropertyValue('--colors-brand-ink').trim(),
    soft: getComputedStyle(el).getPropertyValue('--colors-brand-soft').trim(),
    accent: getComputedStyle(el).getPropertyValue('--colors-brand-accent').trim(),
  }))
}

// A light-only override of a token the base darkens. The base's dark rule is more specific than a light-only
// rule, so the dark stamp paints the override only because the override also prints a dark rule. The untouched
// accent keeps its base values in each mode.
async function proveConflictShape(c: NeoCase, page: SpecPage, url: string, canonical: string): Promise<void> {
  writeConfig(c.worldDir, legConfig(canonical, CONFLICT_SHAPE))
  await sync(c.worldDir)
  const tokens = ownTokensOf(c.worldDir)
  assert.equal(count(tokens, '@layer tokens {'), 2, 'the base stream holds its tokens and one override block')
  assert.equal(count(tokens, `--colors-brand-ink: ${INK};`), 2, 'the light-only ink prints in the light and the dark rule')
  await page.goto(`${url}?leg=conflict`, { waitUntil: 'load' })
  assert.deepEqual(
    await paintOf(page, 'dark'),
    { ink: INK, soft: SOFT, accent: BASE_ACCENT_DARK },
    'dark mode paints the light-only override over the base dark value'
  )
  assert.deepEqual(
    await paintOf(page, 'light'),
    { ink: INK, soft: SOFT, accent: BASE_ACCENT_LIGHT },
    'light mode paints the override'
  )
  assert.deepEqual(
    await paintOf(page, 'plain'),
    { ink: INK, soft: SOFT, accent: BASE_ACCENT_LIGHT },
    'an unmoded stamp paints the light override'
  )
}

// A leaf with its own dark value: the dark rule carries it, and the light rule keeps its light value.
async function proveDarkLeafShape(c: NeoCase, page: SpecPage, url: string, canonical: string): Promise<void> {
  writeConfig(c.worldDir, legConfig(canonical, DARK_LEAF_SHAPE))
  await sync(c.worldDir)
  const tokens = ownTokensOf(c.worldDir)
  assert.equal(count(tokens, '@layer tokens {'), 2, 'the base stream holds its tokens and one override block')
  assert.ok(tokens.includes(`--colors-brand-accent: ${ACCENT_DARK};`), 'the explicit dark accent is published')
  await page.goto(`${url}?leg=dark-leaf`, { waitUntil: 'load' })
  assert.deepEqual(
    await paintOf(page, 'dark'),
    { ink: BASE_INK_DARK, soft: BASE_SOFT, accent: ACCENT_DARK },
    'dark mode paints the explicit dark value and keeps the base dark of the others'
  )
  assert.deepEqual(
    await paintOf(page, 'light'),
    { ink: BASE_INK_LIGHT, soft: BASE_SOFT, accent: ACCENT_LIGHT },
    'light mode paints the light value'
  )
}

// A valid extends prints the override as one fragment node after the base's node, and the merged tokens carry it:
// a light-only leaf drops the base dark value, and an explicit dark value replaces the base's.
async function proveExtendsShape(c: NeoCase, canonical: string): Promise<void> {
  writeConfig(c.worldDir, legConfig(canonical, EXTENDS_SHAPE))
  await sync(c.worldDir)
  const names = (readPublished(c.worldDir).fragments ?? []).map((node) => node.name)
  const baseAt = names.indexOf(BASE_NAME)
  assert.ok(baseAt >= 0, 'the base node is in the published fragments')
  assert.equal(names[baseAt + 1], `extend:${BASE_NAME}`, 'the extend node follows the base node')
  const evaluatedPath = path.join(c.worldDir, '.reference-ui', 'system', 'evaluated-system.json')
  const evaluated = JSON.parse(fs.readFileSync(evaluatedPath, 'utf8')) as EvaluatedTokens
  assert.equal(evaluated.tokens.colors.brandInk.value, INK, 'the merged light ink is the override')
  assert.equal(evaluated.tokens.colors.brandInk.dark, undefined, 'a light-only leaf drops the base dark value')
  assert.equal(evaluated.tokens.colors.brandAccent.dark, ACCENT_DARK, 'the merged accent dark is the override')
}

// The world rejects each misuse through the bin, then the three valid shapes sync in-process. The canonical
// config is restored with a resync after every run, pass or fail.
export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  const canonical = fs.readFileSync(configPathOf(c.worldDir), 'utf8')
  const publishedBefore = readPublishedText(c.worldDir)
  try {
    await syncBase(c)
    for (const leg of LEGS) {
      writeConfig(c.worldDir, legConfig(canonical, leg))
      proveRejects(c.worldDir, leg, publishedBefore)
    }
    await proveConflictShape(c, page, url, canonical)
    await proveDarkLeafShape(c, page, url, canonical)
    await proveExtendsShape(c, canonical)
  } finally {
    await restoreWorld(c.worldDir, canonical)
  }
}
