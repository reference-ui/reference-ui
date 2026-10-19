/**
 * Portal composition gates and browser proofs. Pins body placement for
 * omitted and null containers, relocation into resolved destinations
 * (including late refs, swaps, ShadowRoots, and iframes), logical context
 * and event bubbling, theme re-anchoring at the destination, and catalog
 * coverage for mixed, keyed, and empty children.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Portal ShadowRoot event contract (FEATURES #1, PORTAL-OWNS)', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/Portal/Portal/ShadowFixture')
    await expect(page.getByTestId('portal-shadow-fixture-root')).toBeVisible()
  })

  test('PT-ENV-03: ShadowRoot destination resolves after attach with no transient body copy', async ({
    page,
  }) => {
    // Before attach: none of the portalled nodes exist anywhere — and in
    // particular no transient body copy (the fixture chrome itself lives in
    // light DOM by design, so only portalled testids are scanned).
    for (const id of ['portal-shadow-btn', 'portal-shadow-sibling', 'portal-shadow-switch-btn']) {
      await expect(page.getByTestId(id)).toHaveCount(0)
    }
    expect(
      await page.evaluate(
        () =>
          document.body.querySelectorAll(
            '[data-testid="portal-shadow-btn"],[data-testid="portal-shadow-sibling"],[data-testid="portal-shadow-switch-btn"]'
          ).length
      )
    ).toBe(0)

    await page.getByTestId('btn-shadow-attach').click()

    // After attach: exactly one copy, inside the shadow root only.
    const btn = page.getByTestId('portal-shadow-btn')
    await expect(btn).toBeVisible()
    expect(
      await page.evaluate(() => !!document.querySelector('[data-testid="portal-shadow-btn"]'))
    ).toBe(false)
    const copies = await page
      .getByTestId('portal-shadow-host')
      .evaluate(el => el.shadowRoot?.querySelectorAll('[data-testid="portal-shadow-btn"]').length ?? -1)
    expect(copies).toBe(1)
  })
});
