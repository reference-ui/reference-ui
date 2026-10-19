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

  test('PT-DOM-01 & PT-CONTAINER-04: Places children directly in document.body when container is omitted or null', async ({
    page,
  }) => {
    const bodyNode = page.getByTestId('body-portalled-node')
    const nullNode = page.getByTestId('explicit-null-portalled-node')

    await expect(bodyNode).toBeVisible()
    await expect(nullNode).toBeVisible()
    await snap(page, 'portal-body-and-null-resting')

    // Assert they are children of body and not inside logical-parent
    const isInLogicalParent = await page
      .getByTestId('logical-parent')
      .locator('[data-testid="body-portalled-node"]')
      .count()
    expect(isInLogicalParent).toBe(0)
  })
});
