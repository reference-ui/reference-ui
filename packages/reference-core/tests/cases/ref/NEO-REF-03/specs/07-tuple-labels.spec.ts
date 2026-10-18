// 07-tuple-labels.spec.ts — NEO-REF-03 oracle test 8, the tuple alias port. Takes { page, url, case } with the
// world freshly synced and opens the padding tuple page. Emits nothing on success; throws when the labeled
// elements miss or the tuple placeholder leaks through on failure.
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
  const text = await openReferencePage(page, url, 'DocsReferenceButtonPadding', '[inline: number, block: number]')
  assert.ok(text.includes('Reference UI reference matrix'), 'the shell heading renders')
  assert.ok(text.includes('Type'), 'the page renders its kind')
  assert.ok(text.includes('[inline: number, block: number]'), 'the page renders the labeled tuple')
  assert.ok(!text.includes('[tuple]'), 'no tuple placeholder leaks through')
}
