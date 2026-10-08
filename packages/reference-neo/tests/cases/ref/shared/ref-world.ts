// Shared reference-case helpers: they take a case world plus a spec page and emit readiness plus text.
// Every NEO-REF spec awaits tasty readiness explicitly (one-shot processes exit before the background
// build fires, and resident ones land after), then queries the manifest or reads the rendered page.
// Browser text reads poll for an anchor first, so assertions never race the async document load.
import fs from 'node:fs'
import type { TastyApi } from '@reference-ui/rust/tasty'
import { getReferenceManifestPath } from '../../../../src/reference/bridge/index.ts'
import { createReferenceUiTastyApi } from '../../../../src/reference/tasty/api.ts'
import type { SpecPage } from '../../../shared/page.ts'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Polls until the background tasty build lands the world manifest, then returns its path.
// Sync returns before the manifest exists by design (deprioritized loop), so every spec waits here.
export async function waitForReferenceReady(worldDir: string, timeoutMs = 30_000): Promise<string> {
  const manifestPath = getReferenceManifestPath(worldDir)
  const started = Date.now()
  while (!fs.existsSync(manifestPath)) {
    if (Date.now() - started > timeoutMs) {
      throw new Error(`reference manifest never landed at ${manifestPath} within ${timeoutMs}ms`)
    }
    await sleep(100)
  }
  return manifestPath
}

// Waits for readiness, then opens the reference tasty API against the world manifest.
// One API per call; callers that re-sync must open a fresh API against the refreshed manifest.
export async function loadReferenceApi(worldDir: string, timeoutMs = 30_000): Promise<TastyApi> {
  const manifestPath = await waitForReferenceReady(worldDir, timeoutMs)
  const api = createReferenceUiTastyApi({ manifestPath })
  await api.ready()
  return api
}

// Reads the body's full text content in one evaluate, so specs assert node-side with real matchers.
// The page surface exposes no text getters, so this single read carries every text assertion.
export async function readBodyText(page: SpecPage): Promise<string> {
  return page.locator('body').evaluate((el) => el.textContent ?? '')
}

// Collapses whitespace runs so JSX formatting never breaks an oracle string comparison.
// Matrix asserts exact strings with single spaces; rendered text normalizes to the same shape.
export function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

// Polls the body text until the anchor appears, then returns the normalized text for assertions.
// Absence assertions must call this first: only an anchored page proves the document rendered.
export async function readBodyTextWhen(
  page: SpecPage,
  anchor: string | RegExp,
  timeoutMs = 15_000
): Promise<string> {
  const started = Date.now()
  let text = ''
  for (;;) {
    text = normalizeText(await readBodyText(page))
    const hit = typeof anchor === 'string' ? text.includes(anchor) : anchor.test(text)
    if (hit) return text
    if (Date.now() - started > timeoutMs) {
      throw new Error(`page never showed ${String(anchor)} within ${timeoutMs}ms; got: ${text.slice(0, 300)}`)
    }
    await sleep(100)
  }
}

// Opens one reference page the way the matrix helper does: navigate by name, wait for the shell,
// then wait for document-only content and return the anchored normalized text. The ready anchor must
// never be the symbol name (the shell renders that before the document loads); kind labels, members,
// and definitions prove the document arrived, while the error text proves the error state arrived.
export async function openReferencePage(
  page: SpecPage,
  url: string,
  name: string,
  ready: string | RegExp
): Promise<string> {
  await page.goto(`${url}?name=${encodeURIComponent(name)}`, { waitUntil: 'load' })
  await page.locator('[data-testid="reference-root"]').waitFor()
  const text = await readBodyTextWhen(page, ready)
  if (!text.includes(name)) throw new Error(`page for ${name} lost its shell name after loading`)
  return text
}

// Clicks every collapsed inherited-members toggle so deep members enter the rendered text.
// Member order follows the generated decls, which differ between core and neo; expansion keeps the
// port coupled to membership (the reference parity) instead of declaration order (generator content).
export async function expandInheritedSections(page: SpecPage): Promise<void> {
  await page.locator('body').evaluate((el) => {
    el.querySelectorAll('[role="button"]').forEach((toggle) => {
      const target = toggle as HTMLElement
      target.click()
    })
  })
}

// Reads the normalized body text once React settles: two consecutive equal reads end the poll.
// Callers use this after in-page clicks, where no new anchor exists but the DOM is still moving.
export async function readBodyTextSettled(page: SpecPage, timeoutMs = 5000): Promise<string> {
  const started = Date.now()
  let previous = ''
  for (;;) {
    const text = normalizeText(await readBodyText(page))
    if (text === previous || Date.now() - started > timeoutMs) return text
    previous = text
    await sleep(100)
  }
}

// Counts innermost exact texts across the page for element-exact count ports. Matrix counts elements
// whose normalized whole text equals the query (a tag pill holding an icon plus its label still matches);
// elements repeating a direct child's text defer to the child, so each rendering counts exactly once.
// Callers query the returned map node-side with the oracle's exact strings.
export async function exactTextFrequencies(page: SpecPage): Promise<Record<string, number>> {
  // Self-contained by necessity: the browser serializes only this callback, so it closes over nothing.
  return page.locator('body').evaluate((el) => {
    function repeatsChildText(known: Map<Element, string>, element: Element, text: string): boolean {
      const children = element.children
      for (let index = 0; index < children.length; index++) {
        if (known.get(children[index]) === text) return true
      }
      return false
    }
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT)
    const texts = new Map<Element, string>()
    let node = walker.nextNode()
    while (node) {
      const element = node as Element
      texts.set(element, (element.textContent ?? '').replace(/\s+/g, ' ').trim())
      node = walker.nextNode()
    }
    const frequencies: Record<string, number> = {}
    for (const [element, text] of texts) {
      if (text.length === 0 || repeatsChildText(texts, element, text)) continue
      frequencies[text] = (frequencies[text] ?? 0) + 1
    }
    return frequencies
  })
}
