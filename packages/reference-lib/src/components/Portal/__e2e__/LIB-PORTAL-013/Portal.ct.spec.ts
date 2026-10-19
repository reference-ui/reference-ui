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

  test('PT-CONTAINER-05: Moves subtree when resolved destination changes', async ({
    page,
  }) => {
    const targetA = page.getByTestId('target-a')
    const targetB = page.getByTestId('target-b')

    await expect(targetA.getByTestId('switchable-portalled-node')).toBeVisible()
    await expect(targetB.getByTestId('switchable-portalled-node')).toHaveCount(0)
    await snap(page, 'portal-destination-target-a')

    // Switch to target B
    await page.getByTestId('btn-switch-destination').click()

    await expect(targetA.getByTestId('switchable-portalled-node')).toHaveCount(0)
    await expect(targetB.getByTestId('switchable-portalled-node')).toBeVisible()
    await snap(page, 'portal-destination-target-b')
  })
});
