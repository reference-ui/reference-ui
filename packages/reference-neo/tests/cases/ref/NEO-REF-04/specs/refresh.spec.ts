// refresh.spec.ts — spec for NEO-REF-04, the rename refresh port. Takes { page, url, case } with the world
// freshly synced, then rewrites one fixture through a rename cycle with a re-sync per spelling. Emits nothing
// on success; throws naming the stale manifest or the unrefreshed page when the trigger stops restoring.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import type { NeoCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import { sync } from '../../../../../src/sync/index.ts'
import { loadReferenceApi, readBodyTextWhen, waitForReferenceReady } from '../../shared/ref-world.ts'

interface SpecInput {
  page: SpecPage
  url: string
  case: NeoCase
}

const ORIGINAL = 'ReferenceRebuildOriginalFixture'
const RENAMED = 'ReferenceRebuildRenamedFixture'

function fixtureSource(name: string): string {
  return `// Rebuild fixture: it declares the renamed symbol the refresh spec swaps between two spellings.\n// The spec rewrites this file mid-run, so every spelling carries the header the gate requires.\nexport interface ${name} {\n  label: string\n}\n`
}

// Writes one spelling, re-syncs (the wipe deletes the manifest), and awaits the trigger restoration.
// The first call also self-heals a crashed previous run by resetting to the original spelling.
async function resyncSpelling(worldDir: string, name: string): Promise<void> {
  fs.writeFileSync(path.join(worldDir, 'src', 'rebuild.fixture.ts'), fixtureSource(name))
  await sync(worldDir)
  await waitForReferenceReady(worldDir)
}

export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  await resyncSpelling(c.worldDir, ORIGINAL)
  const before = await loadReferenceApi(c.worldDir)
  const original = await before.loadSymbolByName(ORIGINAL)
  assert.equal(original.getKind(), 'interface')

  await resyncSpelling(c.worldDir, RENAMED)
  const after = await loadReferenceApi(c.worldDir)
  const renamed = await after.loadSymbolByName(RENAMED)
  assert.equal(renamed.getName(), RENAMED)
  await assert.rejects(after.loadSymbolByName(ORIGINAL), 'the original spelling leaves the refreshed manifest')

  await page.goto(`${url}?name=${RENAMED}`, { waitUntil: 'load' })
  await page.locator('[data-testid="reference-root"]').waitFor()
  const text = await readBodyTextWhen(page, 'Interface')
  assert.ok(text.includes(RENAMED), 'the renamed page names its symbol')
  assert.ok(text.includes('label'), 'the renamed page renders its member')
  assert.ok(!text.includes(ORIGINAL), 'the renamed page shows no stale spelling')

  await resyncSpelling(c.worldDir, ORIGINAL)
}
