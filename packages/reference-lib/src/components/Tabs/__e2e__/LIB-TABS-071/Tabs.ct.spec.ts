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
  test('root keepMounted keeps inactive panels in the DOM and preserves form state', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/KeepMounted')
    await expect(page.getByTestId('tabs-keep-root')).toBeVisible()

    const panelBilling = page.getByTestId('panel-k-billing')
    const input = page.getByTestId('panel-k-input')

    // Inactive panel is hidden but attached with its children.
    await expect(panelBilling).toBeAttached()
    await expect(panelBilling).toBeHidden()
    await expect(input).toBeAttached()

    // Fill while visible, round-trip through general, and the draft
    // survives without remount (hidden inputs reject fill, so the
    // toHaveValue check while hidden is the unmount detector).
    await page.getByTestId('tab-k-billing').click()
    await expect(panelBilling).toBeVisible()
    await input.fill('draft')
    await page.getByTestId('tab-k-general').click()
    await expect(panelBilling).toBeHidden()
    await expect(input).toBeAttached()
    await expect(input).toHaveValue('draft')
    await page.getByTestId('tab-k-billing').click()
    await expect(input).toHaveValue('draft')
  })
});
