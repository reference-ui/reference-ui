/**
 * Tabs composition gates and browser proofs. Pins tablist/tab/panel
 * rendering with ARIA linkage, automatic and manual selection, RTL arrow
 * reversal, nested isolation, focus rescue and handoff, dynamic disable
 * and removal, the MyTabs system-variant demo, ShadowRoot locality,
 * keepMounted panels, and real-gesture selection semantics.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Tabs Composition Gates & Browser Proofs', () => {
  test('TB-NEST-01: Nested instances isolate arrow movement in both directions', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/Nested')
    await expect(page.getByTestId('tabs-nested-root')).toBeVisible()

    const tabOuterGeneral = page.getByTestId('tab-n-outer-general')
    const tabOuterBilling = page.getByTestId('tab-n-outer-billing')
    const tabInnerA = page.getByTestId('tab-n-inner-a')
    const tabInnerB = page.getByTestId('tab-n-inner-b')
    const panelInnerA = page.getByTestId('panel-n-inner-a')
    const panelInnerB = page.getByTestId('panel-n-inner-b')

    // Inner arrows stay inner.
    await tabInnerA.focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabInnerB).toBeFocused()
    await expect(tabInnerB).toHaveAttribute('aria-selected', 'true')
    await expect(panelInnerB).toBeVisible()
    await expect(panelInnerA).toBeHidden()
    await expect(tabOuterGeneral).toHaveAttribute('aria-selected', 'true')

    // Outer arrows skip over nested tabs.
    await tabOuterGeneral.focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabOuterBilling).toBeFocused()
    await expect(tabOuterBilling).toHaveAttribute('aria-selected', 'true')

    // Inactive panels unmount their children, so the inner tree detaches
    // with the outer general panel (current mount policy, unchanged).
    await expect(tabInnerB).toBeHidden()

    // Returning restores the inner tree with its controlled selection.
    await tabOuterGeneral.click()
    await expect(tabInnerB).toHaveAttribute('aria-selected', 'true')
    await expect(panelInnerB).toBeVisible()
  })
});
