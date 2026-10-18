// exact-file-include.spec.ts — spec for CORE-WATCH-31, the exact-file include case. Takes { case } from the runner
// with the world synced, whose include lists `theme/base.ts` and `theme/tokens.ts` with no glob, and asserts
// node-side. The one-shot sync accepts those paths, so watchSync() must boot on them too, then an edit to the exact
// file resyncs the sheet to the new class. Emits nothing on success; throws naming the failed boot or missed resync.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import type { CoreCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import { sync } from '../../../../../src/sync/index.ts'
import { watchSync } from '../../../../../src/lib/watch/index.ts'

interface SpecInput {
  page: SpecPage
  case: CoreCase
}

const HEADER = `// Baseline css() for the CORE-WATCH-31 world: one utility the sheet always carries. The include names this file
// exactly, and the spec rewrites it under a live watch, then restores it before and after every run.

import { css } from '@reference-ui/react'
`
const BASE_START = `${HEADER}\nexport const base = css({ zIndex: 3101 })\n`
const BASE_CHANGED = `${HEADER}\nexport const base = css({ zIndex: 3102 })\n`
const START_RULE = /__z_3101\s*\{\s*z-index:\s*3101/
const CHANGED_RULE = /__z_3102\s*\{\s*z-index:\s*3102/

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Poll until cond holds or the budget burns; a resync is one native compile, so the budget is generous.
async function waitFor(cond: () => boolean, label: string): Promise<void> {
  const deadline = Date.now() + 30000
  while (!cond()) {
    assert.ok(Date.now() < deadline, `timed out waiting for ${label}`)
    await sleep(100)
  }
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const base = path.join(c.worldDir, 'theme', 'base.ts')
  const sheetPath = path.join(c.worldDir, '.reference-ui', 'styled', 'styles.css')
  const sheet = (): string => fs.readFileSync(sheetPath, 'utf8')

  fs.writeFileSync(base, BASE_START)
  try {
    await sync(c.worldDir)
    assert.match(sheet(), START_RULE, 'one-shot sync compiles the exact file the include names')

    let resyncs = 0
    const handle = await watchSync(c.worldDir, {
      onResync: () => {
        resyncs += 1
      },
    })
    try {
      // Let the subscriptions go fully live before the mutation, so no pre-watch write backfills mid-proof.
      await sleep(500)
      const before = resyncs
      fs.writeFileSync(base, BASE_CHANGED)
      await waitFor(() => resyncs > before, 'resync after the edit to the exact include path')
      assert.match(sheet(), CHANGED_RULE, 'edit to the exact include path resyncs the sheet to the new class')
      assert.doesNotMatch(sheet(), START_RULE, 'edit to the exact include path drops the class it replaced')
    } finally {
      await handle.stop()
    }
  } finally {
    fs.writeFileSync(base, BASE_START)
    await sync(c.worldDir)
  }
}
