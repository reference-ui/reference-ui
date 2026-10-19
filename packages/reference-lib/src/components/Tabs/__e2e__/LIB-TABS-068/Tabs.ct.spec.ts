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
  test('TB-DYNAMIC-03: removing the focused tab hands off from its former position', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/Handoff')
    await expect(page.getByTestId('tabs-handoff-root')).toBeVisible()

    const tabBilling = page.getByTestId('tab-h-billing')
    const tabGeneral = page.getByTestId('tab-h-general')

    await tabBilling.focus()
    await page.getByTestId('handoff-remove').click()
    // general/security tie around billing's former slot; preceding wins.
    // (Position-aware walk past first-enabled is pinned in unit.)
    await expect(tabGeneral).toBeFocused()
    await expect(tabGeneral).toHaveAttribute('tabindex', '0')
    await expect(tabGeneral).toHaveAttribute('aria-selected', 'true')
  })
});
