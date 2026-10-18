// 08-origin-labels.spec.ts — NEO-REF-03 oracle test 9, the inherited origin port. Takes { page, url, case }
// with the world freshly synced and opens the split button page. Emits nothing on success; throws naming the
// first origin label, member, or default missing from the rendered page on failure.
import assert from 'node:assert/strict'
import type { NeoCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import { expandInheritedSections, openReferencePage, readBodyTextSettled, waitForReferenceReady } from '../../shared/ref-world.ts'

interface SpecInput {
  page: SpecPage
  url: string
  case: NeoCase
}

const MEMBERS = ['label', 'controlId', 'interactionRole', 'announceLabel', 'hasMenu']

const ORIGINS = [
  'DocsReferenceButtonProps',
  'DocsReferencePressableProps',
  'DocsReferenceControlBaseProps',
]

export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  await waitForReferenceReady(c.worldDir)
  const shell = await openReferencePage(page, url, 'DocsReferenceSplitButtonProps', 'Extends')
  assert.ok(shell.includes('Reference UI reference matrix'), 'the shell heading renders')
  assert.ok(shell.includes('Interface'), 'the page renders its kind')
  // Order-insensitive by D-OPEN-2: the compiler id-sorts extends, so the line order follows
  // root-sensitive symbol hashes instead of the clause order the oracle asserts.
  assert.ok(shell.includes('Extends'), 'the page renders the extends line')
  for (const parent of ['DocsReferenceButtonProps', 'DocsReferencePressableProps']) {
    assert.ok(shell.includes(parent), `the extends line names ${parent}`)
  }
  await expandInheritedSections(page)
  const text = await readBodyTextSettled(page)
  for (const member of MEMBERS) {
    assert.ok(text.includes(member), `the page renders ${member}`)
  }
  for (const origin of ORIGINS) {
    const pattern = new RegExp(`Inherited from\\s*${origin}\\s*\\(\\d+\\)`)
    assert.ok(pattern.test(text), `the page renders the ${origin} origin with its count`)
  }
  assert.ok(text.includes('lg'), 'the page renders the size default')
}
