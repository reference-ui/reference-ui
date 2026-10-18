// 01-interface-members.spec.ts — NEO-REF-03 oracle test 1, the interface member port. Takes { page, url, case }
// with the world freshly synced and opens the fixture interface page. Emits nothing on success; throws naming
// the first member, chip, or union label missing from the rendered table on failure.
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
  const text = await openReferencePage(page, url, 'ReferenceApiFixture', 'Interface')
  assert.ok(text.includes('Reference UI reference matrix'), 'the shell heading renders')
  assert.ok(text.includes('Interface'), 'the page renders its kind')
  for (const member of ['label', 'disabled', 'variant']) {
    assert.ok(text.includes(member), `the table renders ${member}`)
  }
  assert.ok(text.includes('Union'), 'the union member renders its chip')
  for (const chip of ['solid', 'ghost']) {
    assert.ok(text.includes(chip), `the union renders ${chip}`)
  }
}
