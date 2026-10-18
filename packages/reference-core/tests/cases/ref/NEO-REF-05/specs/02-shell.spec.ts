// shell.spec.ts — spec for NEO-REF-05, the error plus degenerate plus provider proofs. Takes
// { page, url, case } with the world freshly synced and asserts four navigations node-side. Emits nothing
// on success; throws naming the first shell state that misrenders on failure.
import assert from 'node:assert/strict'
import type { NeoCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import { readBodyTextWhen, waitForReferenceReady } from '../../shared/ref-world.ts'

interface SpecInput {
  page: SpecPage
  url: string
  case: NeoCase
}

async function readPage(page: SpecPage, url: string, query: string, anchor: string): Promise<string> {
  await page.goto(`${url}${query}`, { waitUntil: 'load' })
  await page.locator('[data-testid="reference-root"]').waitFor()
  return readBodyTextWhen(page, anchor)
}

export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  await waitForReferenceReady(c.worldDir)

  // The error state names the missing symbol and carries the failure message.
  const error = await readPage(page, url, '?name=ReferenceMissingSymbolFixture', 'Failed to load')
  assert.ok(error.includes('ReferenceMissingSymbolFixture'), 'the error state names its symbol')

  // The degenerate member-less interface renders a document: the document builder is total, so the
  // defensive empty state is unreachable through the shipped runtime and must never appear here.
  const degenerate = await readPage(page, url, '?name=ReferenceEmptyFixture', 'Interface')
  assert.ok(degenerate.includes('Interface'), 'the degenerate page renders its kind')
  assert.ok(
    degenerate.includes('No members were emitted for this interface.'),
    'the degenerate page states its emptiness'
  )
  assert.ok(!degenerate.includes('Failed to load'), 'the degenerate page is no error')
  assert.ok(
    !degenerate.includes('No reference document was produced'),
    'the defensive empty state stays unreachable'
  )

  // The context hook loads through a provided runtime.
  const provided = await readPage(page, url, '?view=provider&name=ReferenceApiFixture', 'document: ')
  assert.ok(provided.includes('document: ReferenceApiFixture'), 'the provider path loads the document')

  // Without a provider the hook throws the required-runtime error, surfaced as page text.
  const unprovided = await readPage(page, url, '?view=no-provider&name=ReferenceApiFixture', 'required')
  assert.ok(
    unprovided.includes('ReferenceRuntimeProvider is required'),
    'the missing provider errors loudly'
  )
}
