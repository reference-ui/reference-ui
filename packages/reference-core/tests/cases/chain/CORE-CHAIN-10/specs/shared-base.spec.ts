// shared-base.spec.ts — spec for CORE-CHAIN-10, the shared base evaluated once. It takes { page, url, case }
// with the app world synced by the runner. It syncs the shared base a for real, branches b and c that extend
// a, the diamond d that extends [b, c], and then the app e that extends [d]. It checks that d's published
// fragment carries a's bundle once, and that e resolves the same tokens as d and paints what d resolves; it
// restores every canonical config in a finally, emits nothing on success, and throws one line on failure.
import path from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import type { CoreCase } from '../../../../shared/cases.ts'
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
  case: CoreCase
}

// Only a's bundle holds this literal, so its count in a published fragment counts a's copies.
const A_MARK = '#aa0000'
const X_PAINT = 'rgb(187, 0, 0)'

const A_LINK: UpstreamLink = { binding: 'upstreamA', from: '../a/.reference-ui/system/baseSystem.mjs' }
const B_LINK: UpstreamLink = { binding: 'upstreamB', from: '../b/.reference-ui/system/baseSystem.mjs' }
const C_LINK: UpstreamLink = { binding: 'upstreamC', from: '../c/.reference-ui/system/baseSystem.mjs' }
const D_LINK: UpstreamLink = { binding: 'upstreamD', from: './upstream/d/.reference-ui/system/baseSystem.mjs' }

function dirOf(kase: CoreCase, name: string): string {
  return path.join(kase.worldDir, 'upstream', name)
}

function countOf(text: string, needle: string): number {
  return text.split(needle).length - 1
}

export default async function run({ page, url, case: kase }: SpecInput): Promise<void> {
  const canonical = {
    world: canonicalConfig(kase.worldDir),
    b: canonicalConfig(dirOf(kase, 'b')),
    c: canonicalConfig(dirOf(kase, 'c')),
    d: canonicalConfig(dirOf(kase, 'd')),
  }

  try {
    await syncUpstream(dirOf(kase, 'a'))
    writeConfig(dirOf(kase, 'b'), wireConfig(canonical.b, [A_LINK], ['upstreamA']))
    await syncUpstream(dirOf(kase, 'b'))
    writeConfig(dirOf(kase, 'c'), wireConfig(canonical.c, [A_LINK], ['upstreamA']))
    await syncUpstream(dirOf(kase, 'c'))
    writeConfig(dirOf(kase, 'd'), wireConfig(canonical.d, [B_LINK, C_LINK], ['upstreamB', 'upstreamC']))
    const published = await syncUpstream(dirOf(kase, 'd'))
    const dTokens = readEvaluated(dirOf(kase, 'd')).tokens

    writeConfig(kase.worldDir, wireConfig(canonical.world, [D_LINK], ['upstreamD']))
    await sync(kase.worldDir)
    const eTokens = readEvaluated(kase.worldDir).tokens

    const problems: string[] = []
    const copies = countOf(published.fragment, A_MARK)
    if (copies !== 1) problems.push(`D's published fragment carries a's bundle ${copies} times, expected once`)
    if (!isDeepStrictEqual(eTokens, dTokens)) {
      problems.push(`E→[D] resolves ${JSON.stringify(eTokens)}, D resolves ${JSON.stringify(dTokens)}`)
    }

    await page.goto(`${url}?stage=e`, { waitUntil: 'load' })
    const paint = await paintOf(page, 'probe-x')
    if (paint !== X_PAINT) problems.push(`E→[D] paints x as ${paint}, expected ${X_PAINT}`)
    if (problems.length > 0) throw new Error(problems.join('; '))
  } finally {
    await restoreDir(dirOf(kase, 'd'), canonical.d)
    await restoreDir(dirOf(kase, 'c'), canonical.c)
    await restoreDir(dirOf(kase, 'b'), canonical.b)
    await restoreDir(kase.worldDir, canonical.world)
  }
}
