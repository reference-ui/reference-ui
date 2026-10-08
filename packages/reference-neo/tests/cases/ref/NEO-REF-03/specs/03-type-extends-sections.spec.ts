// 03-type-extends-sections.spec.ts — NEO-REF-03 oracle test 4, the inherited sections port. Takes
// { page, url, case } with the world freshly synced and opens the alias-extends fixture page. Emits nothing
// on success; throws naming the first inherited section or local member missing from the page on failure.
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
  const text = await openReferencePage(page, url, 'ReferenceStylePropsTypeExtendsFixture', /Inherited from\s/)
  assert.ok(text.includes('Reference UI reference matrix'), 'the shell heading renders')
  assert.ok(
    /Inherited from\s*ReferenceStylePropsTypeBaseFixture\s*\(\d+\)/.test(text),
    'the page renders the inherited section with its count'
  )
  assert.ok(text.includes('localTone'), 'the page renders the local member')
  assert.ok(!text.includes('Failed to load'), 'the page loads without errors')
}
