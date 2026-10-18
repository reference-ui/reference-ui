// 10-mapped-object.spec.ts — NEO-REF-03 oracle test 11, the mapped alias port. Takes { page, url, case } with
// the world freshly synced and opens the tone labels plus spacing preview pages. Emits nothing on success;
// throws naming the first mapped literal or object member missing, or the first leaked fallback, on failure.
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
  const mapped = await openReferencePage(page, url, 'DocsReferenceToneLabels', '[K in DocsReferenceButtonVariant')
  assert.ok(mapped.includes('Reference UI reference matrix'), 'the shell heading renders')
  assert.ok(mapped.includes('Type'), 'the mapped page renders its kind')
  // Split so the oracle's literal ${} survives the noTemplateCurlyInString lint.
  const mappedLiteral = '{ [K in DocsReferenceButtonVariant as `tone-$' + '{K}`]: K }'
  assert.ok(mapped.includes(mappedLiteral), 'the mapped page renders the mapped literal')
  assert.ok(!mapped.includes('mapped'), 'no mapped placeholder leaks through')

  const preview = await openReferencePage(page, url, 'DocsReferenceSpacingPreview', 'comfortable')
  assert.ok(preview.includes('Type'), 'the preview page renders its kind')
  for (const member of ['compact', 'comfortable', 'spacious']) {
    assert.ok(preview.includes(member), `the preview renders ${member}`)
  }
  assert.ok(!preview.includes('Definition'), 'the object-like page shows members, not a definition')
}
