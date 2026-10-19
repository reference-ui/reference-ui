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

  test('PT-DOM-06: Null, false, and empty-fragment children add nothing and log no errors', async ({
    page,
  }) => {
    // Each destination keeps only its sentinel child.
    for (const id of [
      'coverage-empty-null-dest',
      'coverage-empty-false-dest',
      'coverage-empty-frag-dest',
    ]) {
      expect(await page.getByTestId(id).evaluate(el => el.childNodes.length)).toBe(1)
    }
    // No render or console error anywhere in the fixture lifecycle.
    expect(pageErrors).toEqual([])
  })
});
