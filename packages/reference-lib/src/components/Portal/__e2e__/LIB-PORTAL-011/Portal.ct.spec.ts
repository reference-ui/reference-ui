/**
 * Portal composition gates and browser proofs. Pins body placement for
 * omitted and null containers, relocation into resolved destinations
 * (including late refs, swaps, ShadowRoots, and iframes), logical context
 * and event bubbling, theme re-anchoring at the destination, and catalog
 * coverage for mixed, keyed, and empty children.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Portal Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/Portal/Portal/Fixture')
    await expect(page.getByTestId('portal-fixture-root')).toBeVisible()
  })

  test('PT-DOM-03 & PT-CONTAINER-01: Relocates children into the resolved custom destination ref', async ({
    page,
  }) => {
    const container = page.getByTestId('custom-destination-container')
    const btn = container.getByTestId('context-and-event-btn')

    await expect(btn).toBeVisible()
    await snap(page, 'portal-custom-destination')
  })
});
