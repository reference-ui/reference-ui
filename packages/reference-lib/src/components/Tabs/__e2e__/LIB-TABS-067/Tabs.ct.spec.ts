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
  test('TB-DYNAMIC-03: disabling the focused tab hands off to the preceding tab on a tie', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/Handoff')
    await expect(page.getByTestId('tabs-handoff-root')).toBeVisible()

    const tabGeneral = page.getByTestId('tab-h-general')
    const tabBilling = page.getByTestId('tab-h-billing')
    const panelGeneral = page.getByTestId('panel-h-general')

    await tabBilling.focus()
    await expect(tabBilling).toBeFocused()
    await page.getByTestId('handoff-disable').click()
    // general/security tie around billing; preceding wins. Selection and
    // visible panel unchanged.
    await expect(tabGeneral).toBeFocused()
    await expect(tabGeneral).toHaveAttribute('tabindex', '0')
    await expect(tabGeneral).toHaveAttribute('aria-selected', 'true')
    await expect(panelGeneral).toBeVisible()
  })
});
