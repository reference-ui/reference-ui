// outside-root-edit.spec.ts — spec for NEO-WATCH-30, the outside-root include case. Takes { case } from the runner
// with the world synced, writes ../shared/colors.tsx beside the world, and asserts node-side. The include mixes an
// unrooted **/*.tsx with ../shared/**, so the watch must subscribe the outside directory: an edit there resyncs the
// sheet to the new class. Emits nothing on success; throws naming the missed resync on failure.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import type { NeoCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import { sync } from '../../../../../src/sync/index.ts'
import { watchSync } from '../../../../../src/lib/watch/index.ts'

interface SpecInput {
  page: SpecPage
  case: NeoCase
}

const SHARED_START = `import { css } from '@reference-ui/react'\n\nexport const shared = css({ zIndex: 4501 })\n`
const SHARED_CHANGED = `import { css } from '@reference-ui/react'\n\nexport const shared = css({ zIndex: 4502 })\n`
const START_RULE = /__z_4501\s*\{\s*z-index:\s*4501/
const CHANGED_RULE = /__z_4502\s*\{\s*z-index:\s*4502/

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
  const sharedDir = path.join(c.worldDir, '..', 'shared')
  const target = path.join(sharedDir, 'colors.tsx')
  const sheetPath = path.join(c.worldDir, '.reference-ui', 'styled', 'styles.css')
  const sheet = (): string => fs.readFileSync(sheetPath, 'utf8')

  fs.mkdirSync(sharedDir, { recursive: true })
  fs.writeFileSync(target, SHARED_START)
  try {
    await sync(c.worldDir)
    assert.match(sheet(), START_RULE, 'baseline sheet compiles the file outside the project root')

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
      fs.writeFileSync(target, SHARED_CHANGED)
      await waitFor(() => resyncs > before, 'resync after the edit under ../shared')
      assert.match(sheet(), CHANGED_RULE, 'edit under ../shared resyncs the sheet to the new class')
      assert.doesNotMatch(sheet(), START_RULE, 'edit under ../shared drops the class it replaced')
    } finally {
      await handle.stop()
    }
  } finally {
    fs.rmSync(sharedDir, { recursive: true, force: true })
  }
}
