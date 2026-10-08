// 17-missing-symbol.spec.ts — NEO-REF-03 oracle test 18, the missing symbol port. Takes { page, url, case }
// with the world freshly synced and opens a symbol that does not exist. Emits nothing on success; throws when
// the readable error misses or forgets the requested name on failure.
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
  const text = await openReferencePage(page, url, 'ReferenceMissingSymbolFixture', /Failed to load/)
  assert.ok(text.includes('Reference UI reference matrix'), 'the shell heading renders')
  assert.ok(text.includes('Failed to load'), 'the page renders its readable error')
  assert.ok(text.includes('ReferenceMissingSymbolFixture'), 'the error names the missing symbol')
}
