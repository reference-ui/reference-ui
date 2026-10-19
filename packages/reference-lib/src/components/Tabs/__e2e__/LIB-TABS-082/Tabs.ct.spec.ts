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
  test('TB-COMP-02: manual vertical editor separates focus, skip, blur, and reveal', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/CompEditor')
    await expect(page.getByTestId('tabs-c2-root')).toBeVisible()

    const tabPreview = page.getByTestId('tab-c2-preview')
    const tabSource = page.getByTestId('tab-c2-source')
    const log = page.getByTestId('tabs-c2-log')

    // ArrowDown skips disabled History without hiding Preview.
    await tabPreview.focus()
    await page.keyboard.press('ArrowDown')
    await expect(tabSource).toBeFocused()
    await expect(tabSource).toHaveAttribute('tabindex', '0')
    await expect(tabPreview).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('panel-c2-preview')).toBeVisible()
    await expect(log).toHaveText('')

    // Enter requests source; the pending panel stays until accepted.
    await page.keyboard.press('Enter')
    await expect(log).toHaveText('change:source')
    await expect(page.getByTestId('panel-c2-preview')).toBeVisible()

    // Keyboard back to the source stop blurs the input exactly once
    // (unmount-blur is event-silent in Chromium, so the Tab order carries
    // the observable: the input blurs on Shift+Tab, and acceptance adds no
    // second blur).
    await page.getByTestId('panel-c2-input').focus()
    await expect(page.getByTestId('panel-c2-input')).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(tabSource).toBeFocused()
    await expect(log).toHaveText('change:source|blur:input')
    await page.getByTestId('c2-accept').click()
    await expect(log).toHaveText('change:source|blur:input')
    await expect(page.getByTestId('panel-c2-source')).toBeVisible()
    await expect(page.getByTestId('panel-c2-preview')).toBeHidden()
    await expect(tabSource).toHaveAttribute('aria-selected', 'true')
  })
});
