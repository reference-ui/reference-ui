// 11-discriminated-unions.spec.ts — CORE-REF-03 oracle test 12, the discriminated union port. Takes
// { page, url, case } with the world freshly synced and opens the interactive element page. Emits nothing on
// success; throws when the branches' members miss from the merged member list the page renders.
import assert from 'node:assert/strict'
import type { CoreCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import { openReferencePage, waitForReferenceReady } from '../../shared/ref-world.ts'

interface SpecInput {
  page: SpecPage
  url: string
  case: CoreCase
}

export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  await waitForReferenceReady(c.worldDir)
  const text = await openReferencePage(page, url, 'DocsReferenceInteractiveElement', 'onPress')
  assert.ok(text.includes('Reference UI reference matrix'), 'the shell heading renders')
  assert.ok(text.includes('Type'), 'the page renders its kind')
  // Both object branches merge into one member list: the shared discriminant, then each branch's own members.
  for (const member of ['kind', 'action', 'link', 'onPress', 'disabled', 'href', 'target', '_self', '_blank']) {
    assert.ok(text.includes(member), `the merged member list shows ${member}`)
  }
}
