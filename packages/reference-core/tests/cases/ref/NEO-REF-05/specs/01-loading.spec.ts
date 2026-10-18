// loading.spec.ts — spec for NEO-REF-05, the loading-state proof. Takes { page, url, case } with the world
// freshly synced, stalls the symbol chunk responses, and asserts the loading text shows before the document.
// Emits nothing on success; throws when the loading state never appears or the document never follows.
import assert from 'node:assert/strict'
import type { NeoCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import { readBodyTextWhen, waitForReferenceReady } from '../../shared/ref-world.ts'

interface SpecInput {
  page: SpecPage
  url: string
  case: NeoCase
}

// Structural slice of the real page object for request stalling. The shared page surface exposes no
// routing, so this spec narrows the structural type locally; no shared file changes for one assertion.
interface StallRoute {
  continue(): Promise<void>
}

interface RoutablePage {
  route(url: string, handler: (route: StallRoute) => Promise<void>): Promise<void>
  unroute(url: string): Promise<void>
}

const CHUNK_PATTERN = '**/tasty/chunks/**'

export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  await waitForReferenceReady(c.worldDir)
  const routable = page as unknown as RoutablePage
  await routable.route(CHUNK_PATTERN, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await route.continue()
  })

  // A non-default symbol: the runner's setup load already cached the default chunks, and cached
  // responses never reach the stall. The fresh symbol's chunk travels the network, delayed.
  await page.goto(`${url}?name=ReferenceEmptyFixture`, { waitUntil: 'load' })
  await page.locator('[data-testid="reference-root"]').waitFor()
  const loading = await readBodyTextWhen(page, 'Loading reference docs for')
  assert.ok(loading.includes('ReferenceEmptyFixture'), 'the loading state names its symbol')

  await routable.unroute(CHUNK_PATTERN)
  const done = await readBodyTextWhen(page, 'Interface')
  assert.ok(done.includes('ReferenceEmptyFixture'), 'the document names its symbol')
  assert.ok(!done.includes('Loading reference docs for'), 'the document replaces the loading state')
}
