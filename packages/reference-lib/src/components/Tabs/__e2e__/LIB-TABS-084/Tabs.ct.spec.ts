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
  test('TB-COMP-03: nested manual tabs and popups stay independent under outer arrows', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/CompWorkspace')
    await expect(page.getByTestId('tabs-ws-root')).toBeVisible()

    const tabInnerA = page.getByTestId('tab-w-inner-a')
    const tabInnerB = page.getByTestId('tab-w-inner-b')
    const outerLog = page.getByTestId('tabs-ws-outer-log')
    const innerLog = page.getByTestId('tabs-ws-inner-log')

    // Inner manual arrows move focus only; Enter selects.
    await tabInnerA.focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabInnerB).toBeFocused()
    await expect(tabInnerA).toHaveAttribute('aria-selected', 'true')
    await expect(innerLog).toHaveText('')
    await page.keyboard.press('Enter')
    await expect(innerLog).toHaveText('change:b')
    await expect(page.getByTestId('panel-w-inner-b')).toBeVisible()

    // Every inner control operates without touching either log.
    // (Deterministic closes — no dismiss-stack Escape; see TB-NEST-02.)
    await page.getByTestId('ws-menu-trigger').click()
    await expect(page.getByTestId('ws-menu-item-edit')).toBeVisible()
    await page.getByTestId('ws-menu-item-edit').click()
    await expect(page.getByTestId('ws-menu-item-edit')).toBeHidden()
    await page.getByTestId('ws-combo-input').click()
    await expect(page.getByTestId('ws-combo-apple')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('ws-combo-apple')).toBeHidden()
    await page.getByTestId('ws-tt-trigger').hover()
    await expect(page.getByTestId('ws-tt-content')).toBeVisible()
    await page.getByTestId('tabs-ws-root').hover({ position: { x: 10, y: 10 } })
    await expect(innerLog).toHaveText('change:b')
    await expect(outerLog).toHaveText('')

    // Outer arrows move the outer instance alone.
    await page.getByTestId('tab-w-outer-general').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('tab-w-outer-billing')).toBeFocused()
    await expect(page.getByTestId('tab-w-outer-billing')).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect(outerLog).toHaveText('change:billing')
    await expect(innerLog).toHaveText('change:b')
    await expect(page.getByTestId('panel-w-outer-billing')).toBeVisible()
    await expect(page.getByTestId('panel-w-outer-general')).toBeHidden()

    // Returning restores the inner tree with its selection.
    await page.getByTestId('tab-w-outer-general').click()
    await expect(tabInnerB).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('panel-w-inner-b')).toBeVisible()
  })
});
