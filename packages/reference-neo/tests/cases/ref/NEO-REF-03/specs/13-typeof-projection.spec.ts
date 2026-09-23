// 13-typeof-projection.spec.ts — NEO-REF-03 oracle test 14, the typeof alias port. Takes { page, url, case }
// with the world freshly synced and opens the button spacing page. Emits nothing on success; throws naming the
// first projected member missing, or the definition fallback wrongly shown, on failure.
import assert from 'node:assert/strict'
import type { NeoCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import { openReferencePage, waitForReferenceReady } from '../../shared/ref-world.ts'

interface SpecInput {
  page: SpecPage
  url: string
  case: NeoCase
}

export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  await waitForReferenceReady(c.worldDir)
  const text = await openReferencePage(page, url, 'DocsReferenceButtonSpacing', 'comfortable')
  assert.ok(text.includes('Reference UI reference matrix'), 'the shell heading renders')
  assert.ok(text.includes('Type'), 'the page renders its kind')
  for (const member of ['compact', 'comfortable', 'spacious']) {
    assert.ok(text.includes(member), `the projection renders ${member}`)
  }
  assert.ok(!text.includes('Definition'), 'the object-like page shows members, not a definition')
}
