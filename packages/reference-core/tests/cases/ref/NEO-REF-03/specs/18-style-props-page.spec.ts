// 18-style-props-page.spec.ts — NEO-REF-03 oracle test 2, the StyleProps page port. Takes { page, url, case }
// with the world freshly synced and opens the public StyleProps page. Emits nothing on success; throws naming
// the first style member missing from the rendered projection on failure. Runs last (legacy of D-OPEN-1,
// resolved by the RS fix + single-root closure — kept last, harmless).
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
  const shell = await openReferencePage(page, url, 'StyleProps', 'Type')
  assert.ok(shell.includes('Reference UI reference matrix'), 'the shell heading renders')
  assert.ok(shell.includes('Type'), 'the page renders its kind')
  await expandInheritedSections(page)
  const text = await readBodyTextSettled(page)
  assert.ok(text.includes('accentColor'), 'the page renders a projected style member')
  assert.ok(text.includes('container'), 'the page renders the local container member')
  assert.ok(!text.includes('Failed to load'), 'the page loads without errors')
}
