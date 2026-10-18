// owned.spec.ts — spec for NEO-CHAIN-14, the owned-props chain case. It takes { case } with the app world synced
// standalone by the runner. It syncs the upstream package for real, reads the base system it published, extends that
// artifact on disk, re-syncs the app, and checks the app's published sheet and sync diagnostics. The canonical config is
// restored in a finally. Emits nothing on success; throws one line naming every broken claim on failure.
import fs from 'node:fs'
import path from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import type { NeoCase } from '../../../../shared/cases.ts'
import { sync, type SyncResult } from '../../../../../src/sync/index.ts'
import {
  canonicalConfig,
  restoreDir,
  syncUpstream,
  wireConfig,
  writeConfig,
  type PublishedBaseSystem,
  type UpstreamLink,
} from '../../shared/upstream.ts'

interface SpecInput {
  case: NeoCase
}

// The fields of a published base system this case reads beyond the shared helper's name and fragment.
interface OwningBaseSystem extends PublishedBaseSystem {
  jsxElements?: string[]
  jsxOwned?: Record<string, string[]>
}

const UPSTREAM_LINK: UpstreamLink = {
  binding: 'upstreamBase',
  from: './upstream/.reference-ui/system/baseSystem.mjs',
}
const UNKNOWN_TOKEN = 'ATM-W-UNKNOWN-TOKEN'
// A declaration whose value is the owned `lg`: size folds to width and height, so any of the three names counts.
const LG_RULE = /(?<![\w-])(?:width|height|size)\s*:\s*lg\b/g
// The Div control's real size token, which folds to a width in the same sheet.
const CONTROL_RULE = 'width: calc(2 * var(--spacing-root))'

function readSheet(worldDir: string): string {
  return fs.readFileSync(path.join(worldDir, '.reference-ui', 'styled', 'styles.css'), 'utf8')
}

// Each claim is checked on its own, so a run that breaks the chain at the upstream still reports what the app made of it.
function brokenClaims(
  upstream: OwningBaseSystem,
  sheet: string,
  diagnostics: SyncResult['diagnostics'],
): string[] {
  const broken: string[] = []
  const publishesOwned = isDeepStrictEqual(upstream.jsxOwned, { Tile: ['size'] }) && upstream.jsxElements?.includes('Tile')
  if (!publishesOwned) {
    broken.push(`the upstream publishes no jsxOwned { Tile: ['size'] } beside the Tile host (jsxOwned is ${JSON.stringify(upstream.jsxOwned)})`)
  }
  if (!sheet.includes(CONTROL_RULE)) {
    broken.push(`the Div control's size token is not folded into ${CONTROL_RULE}, so the app scan is suspect`)
  }
  const lg = [...new Set([...sheet.matchAll(LG_RULE)].map((match) => match[0]))]
  if (lg.length > 0) broken.push(`the app sheet carries ${lg.join(' and ')}, rules for Tile's own size`)
  const warned = diagnostics.filter((entry) => entry.code === UNKNOWN_TOKEN).length
  if (warned > 0) broken.push(`the app sync reports ${warned} ${UNKNOWN_TOKEN}`)
  return broken
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const canonical = canonicalConfig(c.worldDir)
  const upstreamDir = path.join(c.worldDir, 'upstream')

  try {
    const upstream = (await syncUpstream(upstreamDir)) as OwningBaseSystem

    writeConfig(c.worldDir, wireConfig(canonical, [UPSTREAM_LINK], ['upstreamBase']))
    const { diagnostics } = await sync(c.worldDir)

    const broken = brokenClaims(upstream, readSheet(c.worldDir), diagnostics)
    if (broken.length > 0) throw new Error(`NEO-CHAIN-14 broke: ${broken.join('; ')}`)
  } finally {
    await restoreDir(c.worldDir, canonical)
  }
}
