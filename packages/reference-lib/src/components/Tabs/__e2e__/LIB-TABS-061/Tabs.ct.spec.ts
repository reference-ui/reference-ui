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
  test('TB-DOM-02: Vertical orientation renders vertical tablist and navigates via ArrowDown/Up', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/Vertical')
    await expect(page.getByTestId('tabs-vertical-root')).toBeVisible()

    const tabGeneral = page.getByTestId('tab-v-general')
    const tabBilling = page.getByTestId('tab-v-billing')
    const panelBilling = page.getByTestId('panel-v-billing')
    const list = page.getByTestId('tabs-vertical-list')

    await expect(list).toHaveAttribute('aria-orientation', 'vertical')
    await expect(tabGeneral).toHaveAttribute('aria-selected', 'true')

    // Assert vertical active indicator bar (right border)
    const vertBorder = await tabGeneral.evaluate((el) => {
      const cs = window.getComputedStyle(el)
      return {
        style: cs.borderRightStyle,
        width: cs.borderRightWidth,
        color: cs.borderRightColor,
      }
    })
    expect(vertBorder.style).toBe('solid')
    expect(parseInt(vertBorder.width, 10)).toBeGreaterThanOrEqual(2)
    expect(vertBorder.color).not.toBe('rgba(0, 0, 0, 0)')

    await page.waitForTimeout(300)
    await snap(page, 'vertical-default')
    await snap(list, 'vertical-list-default', { maxDiffPixelRatio: 0.001 })
    await snap(page.getByTestId('tabs-vertical-root'), 'vertical-root-default', { maxDiffPixelRatio: 0.001 })

    // Hover billing
    await tabBilling.hover()
    await page.waitForTimeout(200)
    await snap(page, 'vertical-hover-billing')

    // Click billing tab
    await tabBilling.click()
    await expect(tabBilling).toHaveAttribute('aria-selected', 'true')
    await expect(panelBilling).toBeVisible()

    await page.waitForTimeout(200)
    await snap(page, 'vertical-billing-selected')
    await snap(list, 'vertical-list-billing-selected', { maxDiffPixelRatio: 0.001 })

    // Arrow navigation
    await tabBilling.focus()
    await page.keyboard.press('ArrowDown')
    const tabIntegrations = page.getByTestId('tab-v-integrations')
    await expect(tabIntegrations).toBeFocused()
    await expect(tabIntegrations).toHaveAttribute('aria-selected', 'true')

    await page.waitForTimeout(200)
    await snap(page, 'vertical-integrations-focused')
  })
});
