// 09-generic-headers.spec.ts — NEO-REF-03 oracle test 10, the generic header port. Takes { page, url, case }
// with the world freshly synced and opens the async state page. Emits nothing on success; throws naming the
// first generic, member, or union label missing from the rendered header on failure.
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
  const text = await openReferencePage(page, url, 'DocsReferenceAsyncState', 'Generics')
  assert.ok(text.includes('Reference UI reference matrix'), 'the shell heading renders')
  assert.ok(text.includes('Interface'), 'the page renders its kind')
  assert.ok(
    /Generics\s*TData extends string = DocsReferenceButtonVariant/.test(text),
    'the page renders the generic constraint with its default'
  )
  for (const member of ['status', 'data']) {
    assert.ok(text.includes(member), `the table renders ${member}`)
  }
  assert.ok(text.includes('Union'), 'the status member renders its chip')
  for (const chip of ['idle', 'loading', 'success']) {
    assert.ok(text.includes(chip), `the union renders ${chip}`)
  }
}
