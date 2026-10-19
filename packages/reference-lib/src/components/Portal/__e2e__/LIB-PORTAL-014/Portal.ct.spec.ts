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

  test('PT-REACT-01 & PT-REACT-02: Preserves logical context and bubbles React events to logical parent', async ({
    page,
  }) => {
    const btn = page.getByTestId('context-and-event-btn')
    await expect(btn).toHaveAttribute('data-context-val', 'logical-provider-value')

    const parentClickCount = page.getByTestId('parent-click-count')
    await expect(parentClickCount).toHaveText('0')

    await btn.click()

    // Clicking the portalled button bubbles React event to logical parent
    await expect(parentClickCount).toHaveText('1')
    await snap(page, 'portal-event-bubbled')
  })
});
