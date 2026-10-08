// 15-composed-projection.spec.ts — NEO-REF-03 oracle test 16, the composed alias port. Takes { page, url, case }
// with the world freshly synced and opens the composed button props page. Emits nothing on success; throws
// naming the first projected member missing, or the definition fallback wrongly shown, on failure.
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
  const text = await openReferencePage(page, url, 'DocsReferenceComposedButtonProps', 'controlId')
  assert.ok(text.includes('Reference UI reference matrix'), 'the shell heading renders')
  for (const member of ['label', 'controlId', 'interactionRole']) {
    assert.ok(text.includes(member), `the projection renders ${member}`)
  }
  assert.ok(!text.includes('Definition'), 'the composed page shows members, not a definition')
}
