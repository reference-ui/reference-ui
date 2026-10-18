// ownership.spec.ts — spec for CORE-CHAIN-15, the component-ownership chain case. It takes { page, url, case } with the
// world synced standalone, syncs the upstream package for real, rewrites the app config to extend the base system it
// published, re-syncs, then asserts a consumer-only token paints on every package import shape (direct `Button`,
// published `Tile`, barrel `Button`, `css` wrapper) with zero runtime misses. The canonical config is restored with a
// heal sync in a finally. Emits nothing on success; throws one line naming every unbacked probe and its class on failure.
import fs from 'node:fs'
import path from 'node:path'
import type { CoreCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import { sync } from '../../../../../src/sync/index.ts'
import {
  canonicalConfig,
  paintOf,
  restoreDir,
  syncUpstream,
  wireConfig,
  writeConfig,
  type PublishedBaseSystem,
  type UpstreamLink,
} from '../../shared/upstream.ts'

// The consumer token #0b6e4f, added on top of the frozen upstream package.
const PROBE_RGB = 'rgb(11, 110, 79)'
const PROBE_HEX = '0b6e4f'
const UPSTREAM_NAME = 'core-chain15-up'

const UPSTREAM_LINK: UpstreamLink = {
  binding: 'upstreamBase',
  from: './upstream/.reference-ui/system/baseSystem.mjs',
}

// One package-rendered element per import shape, by its data-testid.
const PROBES: ReadonlyArray<{ shape: string; testId: string }> = [
  { shape: 'direct Button', testId: 'chain15-direct' },
  { shape: 'published Tile', testId: 'chain15-tile' },
  { shape: 'barrel Button', testId: 'chain15-barrel' },
  { shape: 'css wrapper Button', testId: 'chain15-wrapper' },
]

// The published base system fields this case reads beyond the shared helper's name and fragment.
interface HostingBaseSystem extends PublishedBaseSystem {
  jsxElements?: string[]
}

// Playwright's console surface, narrowed to the one member this spec reads: captureMissSite's
// "no compiled class" warning lands on console.warn.
interface ConsoleMessage {
  text(): string
}
interface ConsolePage extends SpecPage {
  on(event: 'console', handler: (message: ConsoleMessage) => void): void
}

interface SpecInput {
  page: SpecPage
  url: string
  case: CoreCase
}

// The upstream must publish its name and Tile as a host, and must not ship the probe value itself.
function upstreamProblems(upstream: HostingBaseSystem, published: string): string[] {
  const broken: string[] = []
  if (upstream.name !== UPSTREAM_NAME) broken.push(`the upstream publishes ${upstream.name}, not ${UPSTREAM_NAME}`)
  if (!upstream.jsxElements?.includes('Tile')) {
    broken.push(`the upstream does not publish Tile in jsxElements (${JSON.stringify(upstream.jsxElements)})`)
  }
  if (published.toLowerCase().includes(PROBE_HEX)) broken.push('the probe value is already in the published package')
  return broken
}

// Each probe is read on its own, so one run names every import shape that fails to paint and the class it carries.
async function unpaintedProbes(page: SpecPage): Promise<string[]> {
  const broken: string[] = []
  for (const probe of PROBES) {
    const node = page.locator(`[data-testid="${probe.testId}"]`)
    await node.waitFor()
    const { color, className } = await node.evaluate((el) => ({
      color: getComputedStyle(el).color,
      className: el.className,
    }))
    if (color !== PROBE_RGB) broken.push(`${probe.shape} paints ${color} (class ${className})`)
  }
  return broken
}

export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  const canonical = canonicalConfig(c.worldDir)
  const upstreamDir = path.join(c.worldDir, 'upstream')

  const misses: string[] = []
  ;(page as unknown as ConsolePage).on('console', (message) => {
    if (message.text().includes('no compiled class')) misses.push(message.text())
  })

  try {
    const upstream = (await syncUpstream(upstreamDir)) as HostingBaseSystem
    const published = fs.readFileSync(path.join(upstreamDir, '.reference-ui', 'system', 'baseSystem.mjs'), 'utf8')
    const broken = upstreamProblems(upstream, published)

    writeConfig(c.worldDir, wireConfig(canonical, [UPSTREAM_LINK], ['upstreamBase']))
    await sync(c.worldDir)
    await page.goto(`${url}?ownership=1`, { waitUntil: 'load' })

    // Positive control: the same token paints in the app's own scope, so a failing probe is an ownership miss.
    const local = await paintOf(page, 'chain15-local')
    if (local !== PROBE_RGB) broken.push(`the local Div control paints ${local}, so token resolution is suspect`)

    broken.push(...(await unpaintedProbes(page)))
    if (misses.length > 0) broken.push(`${misses.length} runtime miss(es), first: ${misses[0]}`)
    if (broken.length > 0) throw new Error(`CORE-CHAIN-15 broke: ${broken.join('; ')}`)
  } finally {
    await restoreDir(c.worldDir, canonical)
  }
}
