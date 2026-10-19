/**
 * Portal composition gates and browser proofs. Pins body placement for
 * omitted and null containers, relocation into resolved destinations
 * (including late refs, swaps, ShadowRoots, and iframes), logical context
 * and event bubbling, theme re-anchoring at the destination, and catalog
 * coverage for mixed, keyed, and empty children.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Portal catalog coverage (CT re-target, no matrix on this branch)', () => {
  // Per-test page-error capture for PT-DOM-06. Listeners attach before mount
  // (addInitScript is too late: the gallery page is already open). Fresh page
  // per test, so no accumulation across specs.
  let pageErrors: string[] = []

  test.beforeEach(async ({ mount, page }) => {
    pageErrors = []
    page.on('pageerror', e => {
      pageErrors.push(`pageerror:${e.message}`)
    })
    page.on('console', msg => {
      if (msg.type() === 'error') pageErrors.push(`console:${msg.text()}`)
    })
    await mount('components/Portal/Portal/CoverageFixture')
    await expect(page.getByTestId('coverage-fixture-root')).toBeVisible()
  })

  test('PT-DOM-04: Detached fragment destination retains children, then reveals the same nodes on attach', async ({
    page,
  }) => {
    // Pre-attach: the fragment owns both children in order; the document has none.
    const pre = await page.evaluate(() => {
      const frag = (window as unknown as { __coverageDetached: DocumentFragment })
        .__coverageDetached
      return {
        kids: Array.from(frag.children).map(e => e.getAttribute('data-testid')),
        parentIsFrag:
          frag.querySelector('[data-testid="coverage-frag-a"]')?.parentNode === frag,
        inDoc: !!document.querySelector('[data-testid="coverage-frag-a"]'),
      }
    })
    expect(pre.kids).toEqual(['coverage-frag-a', 'coverage-frag-b'])
    expect(pre.parentIsFrag).toBe(true)
    expect(pre.inDoc).toBe(false)

    // Mark node A while detached: the attach must move it, never remount it.
    await page.evaluate(() => {
      const frag = (window as unknown as { __coverageDetached: DocumentFragment })
        .__coverageDetached
      frag
        .querySelector('[data-testid="coverage-frag-a"]')
        ?.setAttribute('data-same-node', 'true')
    })

    await page.getByTestId('btn-coverage-frag-attach').click()

    const host = page.getByTestId('coverage-frag-host')
    await expect(host.getByTestId('coverage-frag-a')).toBeVisible()
    const post = await host.evaluate(el => ({
      kids: Array.from(el.children).map(e => e.getAttribute('data-testid')),
      directA:
        el.querySelector('[data-testid="coverage-frag-a"]')?.parentElement === el,
      marker: el
        .querySelector('[data-testid="coverage-frag-a"]')
        ?.getAttribute('data-same-node'),
    }))
    expect(post.kids).toEqual(['coverage-frag-a', 'coverage-frag-b'])
    expect(post.directA).toBe(true)
    expect(post.marker).toBe('true')
  })
});
