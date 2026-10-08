// 16-pinned-definition.spec.ts — NEO-REF-03 oracle test 17, the definition-first port. Takes { page, url, case }
// with the world freshly synced and opens the pinned target alias page. Emits nothing on success; throws when
// the definition misses or the target members wrongly expand on failure.
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
  const text = await openReferencePage(page, url, 'DocsReferencePinnedTargetAlias', 'Definition')
  assert.ok(text.includes('Reference UI reference matrix'), 'the shell heading renders')
  assert.ok(text.includes('DocsReferencePinnedTarget'), 'the page renders the alias target')
  assert.ok(text.includes('Definition'), 'the page renders its definition first')
  assert.ok(!text.includes('label'), 'the target members stay unexpanded')
}
