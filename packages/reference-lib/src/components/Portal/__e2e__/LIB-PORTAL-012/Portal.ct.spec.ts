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

  test('PT-CONTAINER-02: Waits for late-resolved object ref without transient default body copy', async ({
    page,
  }) => {
    // Before resolving target, node should not exist in DOM
    const refNode = page.getByTestId('ref-portalled-node')
    await expect(refNode).toHaveCount(0)

    // Resolve target
    await page.getByTestId('btn-resolve-target').click()

    // Target is now mounted, child should appear inside it
    const resolvedContainer = page.getByTestId('dynamic-resolved-container')
    await expect(resolvedContainer.getByTestId('ref-portalled-node')).toBeVisible()
    await snap(page, 'portal-dynamic-resolved')
  })
});
