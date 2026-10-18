// shadow.spec.ts — spec for CORE-CHAIN-12, the sync warning for a local token that replaces an upstream value.
// It takes { case } with the app world synced by the runner. It wires the base and mid stand-ins into the app's
// extends, runs a real sync(), and checks the one shadow warning for the path the local leaf replaces, the
// silent equal-value leg, the silent upstream-over-upstream leg, and the evaluated values. It restores the
// canonical config in a finally. Emits nothing on success; throws one line naming every failed check.
import assert from 'node:assert/strict'
import { sync } from '../../../../../src/sync/index.ts'
import type { CoreCase } from '../../../../shared/cases.ts'
import {
  canonicalConfig,
  readEvaluated,
  restoreDir,
  wireConfig,
  writeConfig,
  type UpstreamLink,
} from '../../shared/upstream.ts'

interface SpecInput {
  case: CoreCase
}

const SHADOW_CODE = 'BSS-W-TOKEN-SHADOW'
const BASE_LINK: UpstreamLink = { binding: 'upstreamBase', from: './theme/base.ts' }
const MID_LINK: UpstreamLink = { binding: 'upstreamMid', from: './theme/mid.ts' }
const BRAND_MESSAGE =
  "Local token 'colors.brand' replaces upstream 'core-chain12-base' value '#aa0000' with '#bb0000'."

export default async function run({ case: c }: SpecInput): Promise<void> {
  const canonical = canonicalConfig(c.worldDir)

  try {
    writeConfig(c.worldDir, wireConfig(canonical, [BASE_LINK, MID_LINK], ['upstreamBase', 'upstreamMid']))
    const result = await sync(c.worldDir)
    const shadows = result.diagnostics.filter((entry) => entry.code === SHADOW_CODE)
    const colors = readEvaluated(c.worldDir).tokens.colors

    const problems: string[] = []
    const brand = shadows.filter((entry) => entry.message.includes("'colors.brand'"))
    if (brand.length !== 1) {
      problems.push(`colors.brand warns ${brand.length} times, expected once`)
    } else if (brand[0]?.message !== BRAND_MESSAGE) {
      problems.push(`colors.brand warns "${brand[0]?.message}", expected "${BRAND_MESSAGE}"`)
    }
    if (shadows.length !== 1) {
      const paths = shadows.map((entry) => entry.message).join(' | ')
      problems.push(`expected exactly one shadow warning, got ${shadows.length}: ${paths}`)
    }
    if (colors?.brand?.value !== '#bb0000') problems.push(`brand resolves ${colors?.brand?.value}, expected #bb0000`)
    if (colors?.quiet?.value !== '#777777') problems.push(`quiet resolves ${colors?.quiet?.value}, expected #777777`)
    if (colors?.accent?.value !== '#202020') problems.push(`accent resolves ${colors?.accent?.value}, expected #202020`)
    assert.deepEqual(problems, [], problems.join('; '))
  } finally {
    await restoreDir(c.worldDir, canonical)
  }
}
