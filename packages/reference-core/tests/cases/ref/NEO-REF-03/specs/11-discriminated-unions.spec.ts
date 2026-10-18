// 11-discriminated-unions.spec.ts — NEO-REF-03 oracle test 12, the discriminated union port. Takes
// { page, url, case } with the world freshly synced and opens the interactive element page. Emits nothing on
// success; throws when the union branches miss from the rendered definition on failure.
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
  const text = await openReferencePage(page, url, 'DocsReferenceInteractiveElement', "kind: 'action'")
  assert.ok(text.includes('Reference UI reference matrix'), 'the shell heading renders')
  assert.ok(text.includes('Type'), 'the page renders its kind')
  assert.ok(
    text.includes(
      "{ kind: 'action'; onPress: () => void; disabled?: boolean } | { kind: 'link'; href: string; target?: '_self' | '_blank' }"
    ),
    'the page renders both object branches'
  )
}
