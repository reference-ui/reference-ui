// refresh.spec.ts — spec for CORE-REF-04, the rename refresh proof. Takes { page, url, case } with the world
// freshly synced, then rewrites one fixture through a rename cycle with a re-sync per spelling. A warm sync
// only queues the tasty rebuild, so each step waits until the manifest reflects its spelling, and the fixture
// is restored in a finally so a failed run never leaves the renamed spelling on disk. Emits nothing on
// success; throws naming the stale manifest or the unrefreshed page when the rebuild stops landing.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import type { CoreCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import { sync } from '../../../../../src/sync/index.ts'
import { readBodyTextWhen, waitForReferenceFreshness } from '../../shared/ref-world.ts'

interface SpecInput {
  page: SpecPage
  url: string
  case: CoreCase
}

const ORIGINAL = 'ReferenceRebuildOriginalFixture'
const RENAMED = 'ReferenceRebuildRenamedFixture'

function fixturePath(worldDir: string): string {
  return path.join(worldDir, 'src', 'rebuild.fixture.ts')
}

function fixtureSource(name: string): string {
  return `// Rebuild fixture: it declares the renamed symbol the refresh spec swaps between two spellings.\n// The spec rewrites this file mid-run, so every spelling carries the header the gate requires.\nexport interface ${name} {\n  label: string\n}\n`
}

// Writes one spelling and re-syncs. The tasty rebuild lands on the background loop after sync returns,
// so callers wait for freshness before they read the manifest.
async function resyncSpelling(worldDir: string, name: string): Promise<void> {
  fs.writeFileSync(fixturePath(worldDir), fixtureSource(name))
  await sync(worldDir)
}

export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  try {
    await resyncSpelling(c.worldDir, ORIGINAL)
    const before = await waitForReferenceFreshness(c.worldDir, { present: [ORIGINAL], absent: [RENAMED] })
    const original = await before.loadSymbolByName(ORIGINAL)
    assert.equal(original.getKind(), 'interface')

    await resyncSpelling(c.worldDir, RENAMED)
    const after = await waitForReferenceFreshness(c.worldDir, { present: [RENAMED], absent: [ORIGINAL] })
    const renamed = await after.loadSymbolByName(RENAMED)
    assert.equal(renamed.getName(), RENAMED)
    await assert.rejects(after.loadSymbolByName(ORIGINAL), 'the original spelling leaves the refreshed manifest')

    await page.goto(`${url}?name=${RENAMED}`, { waitUntil: 'load' })
    await page.locator('[data-testid="reference-root"]').waitFor()
    const text = await readBodyTextWhen(page, 'Interface')
    assert.ok(text.includes(RENAMED), 'the renamed page names its symbol')
    assert.ok(text.includes('label'), 'the renamed page renders its member')
    assert.ok(!text.includes(ORIGINAL), 'the renamed page shows no stale spelling')
  } finally {
    // Restores the original spelling on every path; the next run's first step re-syncs it into the manifest.
    fs.writeFileSync(fixturePath(c.worldDir), fixtureSource(ORIGINAL))
  }
}
