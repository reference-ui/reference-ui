// 12-conditional-union.spec.ts — NEO-REF-03 oracle test 13, the conditional alias port. Takes { page, url, case }
// with the world freshly synced and opens the variant meta page. Emits nothing on success; throws when the
// resolved union misses from the rendered definition on failure.
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
  const text = await openReferencePage(page, url, 'DocsReferenceButtonVariantMeta', "emphasis: 'high'")
  assert.ok(text.includes('Reference UI reference matrix'), 'the shell heading renders')
  assert.ok(text.includes('Type'), 'the page renders its kind')
  assert.ok(
    text.includes("{ emphasis: 'high'; fill: true } | { emphasis: 'low'; fill: false }"),
    'the page renders the resolved union'
  )
}
