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

  test('PT-SHADOW-01: Switching destination into a ShadowRoot keeps React events firing', async ({
    page,
  }) => {
    await page.getByTestId('btn-shadow-attach').click()
    const switchBtn = page.getByTestId('portal-shadow-switch-btn')
    const switchLog = page.getByTestId('portal-shadow-switch-log')
    const host = page.getByTestId('portal-shadow-host-b')

    // Light-destination baseline: one child + one logical-parent call.
    await expect(
      page.getByTestId('portal-shadow-target-a').getByTestId('portal-shadow-switch-btn')
    ).toBeVisible()
    await switchBtn.click()
    await expect(switchLog).toHaveText('child,logical-parent')

    // Switch into the shadow destination.
    await page.getByTestId('btn-shadow-switch').click()
    expect(
      await host.evaluate(
        el =>
          !!el.shadowRoot
            ?.querySelector('#portal-shadow-target-b [data-testid="portal-shadow-switch-btn"]')
      )
    ).toBe(true)
    expect(
      await page.evaluate(
        () => !!document.querySelector('[data-testid="portal-shadow-switch-btn"]')
      )
    ).toBe(false)

    // The same logical event sequence survives the move into shadow.
    await switchBtn.click()
    await expect(switchLog).toHaveText('child,logical-parent,child,logical-parent')
  })
});
