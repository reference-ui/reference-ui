// 02-style-extends.spec.ts — NEO-REF-03 oracle test 3, the StyleProps extends port. Takes { page, url, case }
// with the world freshly synced and opens the local extending fixture page. Emits nothing on success; throws
// naming the first inherited or local member missing from the rendered table on failure.
import assert from 'node:assert/strict'
import type { NeoCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import { expandInheritedSections, openReferencePage, readBodyTextSettled, waitForReferenceReady } from '../../shared/ref-world.ts'

interface SpecInput {
  page: SpecPage
  url: string
  case: NeoCase
}

export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  await waitForReferenceReady(c.worldDir)
  const shell = await openReferencePage(page, url, 'ReferenceStylePropsExtendsFixture', 'localTone')
  assert.ok(shell.includes('Reference UI reference matrix'), 'the shell heading renders')
  assert.ok(shell.includes('localTone'), 'the page renders the local member')
  await expandInheritedSections(page)
  const text = await readBodyTextSettled(page)
  assert.ok(text.includes('accentColor'), 'the page renders an inherited style member')
  assert.ok(!text.includes('Failed to load'), 'the page loads without errors')
}
