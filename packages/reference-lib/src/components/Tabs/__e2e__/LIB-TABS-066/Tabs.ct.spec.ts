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
  test('TB-SELECT-07: hiding the focused panel rescues focus to the new tab', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/FocusRescue')
    await expect(page.getByTestId('tabs-rescue-root')).toBeVisible()

    const panelInput = page.getByTestId('panel-f-input')
    const tabBilling = page.getByTestId('tab-f-billing')
    const panelBilling = page.getByTestId('panel-f-billing')

    await panelInput.focus()
    await expect(panelInput).toBeFocused()
    // Programmatic switch (no pointer focus transfer): the focused input
    // unmounts with its panel and focus rescues to the billing tab.
    await page.getByTestId('rescue-switch').click()
    await expect(tabBilling).toBeFocused()
    await expect(tabBilling).toHaveAttribute('aria-selected', 'true')
    await expect(tabBilling).toHaveAttribute('tabindex', '0')
    await expect(panelBilling).toBeVisible()
  })
});
