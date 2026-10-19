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
  test('TB-MANUAL-02: real Space hold requests nothing, release requests once', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/ManualKeys')
    await expect(page.getByTestId('tabs-mk-root')).toBeVisible()

    const tabPreview = page.getByTestId('tab-mk-preview')
    const tabSource = page.getByTestId('tab-mk-source')
    const log = page.getByTestId('tabs-mk-log')

    await tabPreview.focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabSource).toBeFocused()
    await expect(log).toHaveText('')

    await page.keyboard.down('Space')
    await page.waitForTimeout(150)
    await expect(log).toHaveText('')
    await page.keyboard.up('Space')
    await expect(log).toHaveText('change:source')
    await expect(tabSource).toBeFocused()
    await expect(tabSource).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('panel-mk-source')).toBeVisible()
  })
});
