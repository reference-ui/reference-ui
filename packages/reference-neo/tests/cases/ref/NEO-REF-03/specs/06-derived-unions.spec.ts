// 06-derived-unions.spec.ts — NEO-REF-03 oracle test 7, the derived-union pages port. Takes { page, url, case }
// with the world freshly synced and opens four alias pages in sequence. Emits nothing on success; throws naming
// the first derived literal missing, or the first leaked doc line, across the four pages on failure.
import assert from 'node:assert/strict'
import type { NeoCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import { openReferencePage, waitForReferenceReady } from '../../shared/ref-world.ts'

interface SpecInput {
  page: SpecPage
  url: string
  case: NeoCase
}

const PAGES: Array<[string, string]> = [
  ['DocsReferenceSimpleType', "'a' | 'b'"],
  ['DocsReferenceToneKey', "'tone-solid' | 'tone-ghost' | 'tone-outline'"],
  ['DocsReferenceResolvedSize', "'sm' | 'md' | 'lg'"],
  ['DocsReferenceResolvedTone', "'tone-sm' | 'tone-md' | 'tone-lg'"],
]

export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  await waitForReferenceReady(c.worldDir)
  for (const [name, definition] of PAGES) {
    const text = await openReferencePage(page, url, name, definition)
    assert.ok(text.includes('Type'), `${name} renders its kind`)
    assert.ok(text.includes(definition), `${name} renders ${definition}`)
    if (name === 'DocsReferenceSimpleType') {
      assert.ok(
        !text.includes('Optional formatter for the visible label.'),
        'the simple page leaks no foreign doc line'
      )
    }
  }
}
