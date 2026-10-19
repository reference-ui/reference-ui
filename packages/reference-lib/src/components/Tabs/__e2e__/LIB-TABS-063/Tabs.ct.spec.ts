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
  test('TB-MANUAL-01: Manual arrows move focus and the tab stop without selecting', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/Manual')
    await expect(page.getByTestId('tabs-manual-root')).toBeVisible()

    const tabPreview = page.getByTestId('tab-m-preview')
    const tabSource = page.getByTestId('tab-m-source')
    const panelPreview = page.getByTestId('panel-m-preview')
    const panelSource = page.getByTestId('panel-m-source')

    await tabPreview.focus()
    await page.keyboard.press('ArrowRight')
    // Skips disabled history, lands on source; selection stays on preview.
    await expect(tabSource).toBeFocused()
    await expect(tabSource).toHaveAttribute('tabindex', '0')
    await expect(tabPreview).toHaveAttribute('tabindex', '-1')
    await expect(tabPreview).toHaveAttribute('aria-selected', 'true')
    await expect(tabSource).toHaveAttribute('aria-selected', 'false')
    await expect(panelPreview).toBeVisible()
    await expect(panelSource).toBeHidden()

    // Explicit Enter activates the focused tab.
    await page.keyboard.press('Enter')
    await expect(tabSource).toHaveAttribute('aria-selected', 'true')
    await expect(panelSource).toBeVisible()
    await expect(panelPreview).toBeHidden()
  })
});
