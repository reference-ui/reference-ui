// diamond.spec.ts — spec for NEO-CHAIN-09, the diamond that keeps a branch's override. It takes
// { page, url, case } with the app world synced by the runner. It syncs the shared base a for real, then
// branches b and c that each extend a, then the app extending [b, c] and then [c, b], and checks each
// order's resolved x and the computed paints of its probes. It restores every canonical config in a finally
// and emits nothing on success; on failure it throws one line naming every wrong value.
import path from 'node:path'
import type { NeoCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import { sync } from '../../../../../src/sync/index.ts'
import {
  canonicalConfig,
  paintOf,
  readEvaluated,
  restoreDir,
  syncUpstream,
  wireConfig,
  writeConfig,
  type UpstreamLink,
} from '../../shared/upstream.ts'

interface SpecInput {
  page: SpecPage
  url: string
  case: NeoCase
}

// The app side of the diamond: the page to paint, the world to sync, and its canonical config text.
interface Diamond {
  page: SpecPage
  url: string
  worldDir: string
  canonical: string
}

type Branch = 'b' | 'c'

// Both orders must resolve b's value: the bug is order-sensitive, so the second order guards the fix.
const ORDERS: Branch[][] = [
  ['b', 'c'],
  ['c', 'b'],
]
const X_EXPECTED = '#bb0000'
const X_PAINT = 'rgb(187, 0, 0)'
const C_PAINT = 'rgb(0, 170, 85)'
const BASE_LINK: UpstreamLink = { binding: 'upstreamA', from: '../a/.reference-ui/system/baseSystem.mjs' }

function dirOf(kase: NeoCase, name: string): string {
  return path.join(kase.worldDir, 'upstream', name)
}

function bindingOf(branch: Branch): string {
  return `upstream${branch.toUpperCase()}`
}

function linkOf(branch: Branch): UpstreamLink {
  return { binding: bindingOf(branch), from: `./upstream/${branch}/.reference-ui/system/baseSystem.mjs` }
}

// Writes the app to extend one order of branches, syncs it, and checks what that order resolves.
async function checkOrder(d: Diamond, order: Branch[]): Promise<string[]> {
  const label = `D→[${order.map((b) => b.toUpperCase()).join(', ')}]`
  writeConfig(d.worldDir, wireConfig(d.canonical, order.map(linkOf), order.map(bindingOf)))
  await sync(d.worldDir)

  const problems: string[] = []
  const x = readEvaluated(d.worldDir).tokens.colors?.x?.value
  if (x !== X_EXPECTED) problems.push(`${label} resolves x to ${x}, expected ${X_EXPECTED}`)

  await d.page.goto(`${d.url}?order=${order.join('')}`, { waitUntil: 'load' })
  const paintX = await paintOf(d.page, 'probe-x')
  if (paintX !== X_PAINT) problems.push(`${label} paints x as ${paintX}, expected ${X_PAINT}`)
  const paintC = await paintOf(d.page, 'probe-c-leaf')
  if (paintC !== C_PAINT) problems.push(`${label} paints cLeaf as ${paintC}, expected ${C_PAINT}`)
  return problems
}

export default async function run({ page, url, case: kase }: SpecInput): Promise<void> {
  const canonical = {
    world: canonicalConfig(kase.worldDir),
    b: canonicalConfig(dirOf(kase, 'b')),
    c: canonicalConfig(dirOf(kase, 'c')),
  }

  try {
    await syncUpstream(dirOf(kase, 'a'))
    writeConfig(dirOf(kase, 'b'), wireConfig(canonical.b, [BASE_LINK], ['upstreamA']))
    await syncUpstream(dirOf(kase, 'b'))
    writeConfig(dirOf(kase, 'c'), wireConfig(canonical.c, [BASE_LINK], ['upstreamA']))
    await syncUpstream(dirOf(kase, 'c'))

    const diamond: Diamond = { page, url, worldDir: kase.worldDir, canonical: canonical.world }
    const problems: string[] = []
    for (const order of ORDERS) problems.push(...(await checkOrder(diamond, order)))
    if (problems.length > 0) throw new Error(problems.join('; '))
  } finally {
    await restoreDir(dirOf(kase, 'b'), canonical.b)
    await restoreDir(dirOf(kase, 'c'), canonical.c)
    await restoreDir(kase.worldDir, canonical.world)
  }
}
