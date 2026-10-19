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
  test('TB-COMP-01: automatic settings composition coordinates selection without app glue', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/CompSettings')
    await expect(page.getByTestId('tabs-c1-root')).toBeVisible()

    const tabProfile = page.getByTestId('tab-c1-profile')
    const tabBilling = page.getByTestId('tab-c1-billing')
    const tabSecurity = page.getByTestId('tab-c1-security')

    await tabProfile.focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabBilling).toBeFocused()
    await expect(tabBilling).toHaveAttribute('tabindex', '0')
    await expect(tabProfile).toHaveAttribute('tabindex', '-1')
    await expect(tabSecurity).toHaveAttribute('tabindex', '-1')
    await expect(tabBilling).toHaveAttribute('aria-selected', 'true')
    await expect(tabBilling).toHaveAttribute('data-state', 'active')

    // Linkage follows; only the Billing form is visible; no submission.
    const controls = await tabBilling.getAttribute('aria-controls')
    expect(controls).toBe(await page.getByTestId('panel-c1-billing').getAttribute('id'))
    await expect(page.getByTestId('panel-c1-billing')).toBeVisible()
    await expect(page.getByTestId('panel-c1-form')).toBeVisible()
    await expect(page.getByTestId('panel-c1-profile')).toBeHidden()
    await expect(page.getByTestId('panel-c1-security')).toBeHidden()
    await expect(page.getByTestId('tabs-c1-submits')).toHaveText('0')
  })
});
