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
  test('TB-SELECT-06: real pointer selection blurs panel content before tab focus and request', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/SelectLog')
    await expect(page.getByTestId('tabs-select-root')).toBeVisible()

    const input = page.getByTestId('sl-panel-input')
    const tabBilling = page.getByTestId('tab-sl-billing')
    const log = page.getByTestId('tabs-select-log')

    await input.click()
    await expect(input).toBeFocused()
    await tabBilling.click()
    await expect(log).toHaveText('blur:input|focus:billing|change:billing')
    await expect(tabBilling).toBeFocused()
    await expect(tabBilling).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('panel-sl-billing')).toBeVisible()
  })
});
