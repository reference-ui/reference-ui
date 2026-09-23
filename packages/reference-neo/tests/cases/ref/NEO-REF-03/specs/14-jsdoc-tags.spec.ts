// 14-jsdoc-tags.spec.ts — NEO-REF-03 oracle test 15, the JSDoc tag page port. Takes { page, url, case } with the
// world freshly synced and opens the JSDoc tag fixture page. Emits nothing on success; throws naming the first
// tagged member or tag missing from the rendered table on failure.
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
  const text = await openReferencePage(page, url, 'ReferenceJsDocTagFixture', 'formatPreview')
  assert.ok(text.includes('Reference UI reference matrix'), 'the shell heading renders')
  assert.ok(text.includes('Interface'), 'the page renders its kind')
  for (const member of ['formatPreview', 'renderLabel']) {
    assert.ok(text.includes(member), `the table renders ${member}`)
  }
  for (const tag of ['deprecated', 'remarks']) {
    assert.ok(text.includes(tag), `the table renders ${tag}`)
  }
  assert.ok(!text.includes('Failed to load'), 'the page loads without errors')
}
