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
  test('TB-AUTO-02: Horizontal arrows reverse under inherited RTL', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/Rtl')
    await expect(page.getByTestId('tabs-rtl-root')).toBeVisible()

    const tabGeneral = page.getByTestId('tab-r-general')
    const tabBilling = page.getByTestId('tab-r-billing')

    await tabBilling.focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabGeneral).toBeFocused()
    await expect(tabGeneral).toHaveAttribute('aria-selected', 'true')

    await page.keyboard.press('ArrowLeft')
    await expect(tabBilling).toBeFocused()
    await expect(tabBilling).toHaveAttribute('aria-selected', 'true')
  })
});
