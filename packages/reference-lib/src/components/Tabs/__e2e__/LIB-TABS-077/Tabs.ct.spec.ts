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
  test('TB-MANUAL-06: vertical manual tabs ignore direction and require explicit activation', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/ManualKeys')
    await expect(page.getByTestId('tabs-mk-root')).toBeVisible()

    const tabPreview = page.getByTestId('tab-mk-preview')
    const tabSource = page.getByTestId('tab-mk-source')
    const log = page.getByTestId('tabs-mk-log')

    await page.getByTestId('mk-orientation').click()
    await expect(page.getByTestId('tabs-mk-list')).toHaveAttribute(
      'aria-orientation',
      'vertical'
    )

    // LTR: Down/Up and Home/End move among enabled tabs, never selecting.
    await tabPreview.focus()
    await page.keyboard.press('ArrowDown')
    await expect(tabSource).toBeFocused()
    await expect(tabPreview).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('panel-mk-preview')).toBeVisible()
    await page.keyboard.press('ArrowUp')
    await expect(tabPreview).toBeFocused()
    await page.keyboard.press('End')
    await expect(tabSource).toBeFocused()
    await page.keyboard.press('Home')
    await expect(tabPreview).toBeFocused()
    await expect(log).toHaveText('')

    // Horizontal arrows stay unhandled in LTR.
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowRight')
    await expect(tabPreview).toBeFocused()
    await expect(log).toHaveText('')

    // Explicit Space requests once.
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Space')
    await expect(log).toHaveText('change:source')
    await expect(tabSource).toHaveAttribute('aria-selected', 'true')

    // RTL: vertical destinations unchanged, horizontals still unhandled.
    await page.getByTestId('mk-dir').click()
    await tabSource.focus()
    await page.keyboard.press('ArrowUp')
    await expect(tabPreview).toBeFocused()
    await expect(tabSource).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowRight')
    await expect(tabPreview).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(log).toHaveText('change:source|change:preview')
    await expect(tabPreview).toHaveAttribute('aria-selected', 'true')
  })
});
