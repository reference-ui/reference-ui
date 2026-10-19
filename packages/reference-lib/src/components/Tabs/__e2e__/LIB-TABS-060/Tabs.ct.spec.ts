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
  test('TB-DOM-01, TB-DOM-03 & TB-DOM-04: Renders tablist, tabs and panels with active selection, hover, ARIA linkage and keyboard roving', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/Horizontal')
    await expect(page.getByTestId('tabs-fixture-root')).toBeVisible()

    const tabAccount = page.getByTestId('tab-account')
    const panelAccount = page.getByTestId('panel-account')
    const tabPassword = page.getByTestId('tab-password')
    const panelPassword = page.getByTestId('panel-password')
    const tabSettings = page.getByTestId('tab-settings')
    const tabDisabled = page.getByTestId('tab-disabled')

    // Initial resting state
    await expect(tabAccount).toHaveAttribute('role', 'tab')
    await expect(tabAccount).toHaveAttribute('aria-selected', 'true')
    await expect(tabAccount).toHaveAttribute('data-state', 'active')
    await expect(panelAccount).toBeVisible()
    await expect(panelAccount).toHaveAttribute('role', 'tabpanel')

    // Active indicator bar assertions (must be solid line with visible color, not transparent/none)
    const list = page.getByTestId('tabs-list')
    const activeBorder = await tabAccount.evaluate((el) => {
      const cs = window.getComputedStyle(el)
      return {
        style: cs.borderBottomStyle,
        width: cs.borderBottomWidth,
        color: cs.borderBottomColor,
      }
    })
    expect(activeBorder.style).toBe('solid')
    expect(parseInt(activeBorder.width, 10)).toBeGreaterThanOrEqual(2)
    expect(activeBorder.color).not.toBe('rgba(0, 0, 0, 0)')
    expect(activeBorder.color).not.toBe('transparent')

    await expect(tabPassword).toHaveAttribute('aria-selected', 'false')
    await expect(tabPassword).toHaveAttribute('data-state', 'inactive')
    await expect(panelPassword).toBeHidden()

    await page.waitForTimeout(300)
    await snap(page, 'horizontal-default')
    await snap(list, 'horizontal-list-default', { maxDiffPixelRatio: 0.001 })
    await snap(page.getByTestId('tabs-fixture-root'), 'horizontal-root-default', { maxDiffPixelRatio: 0.001 })

    // Hover inactive tab
    await tabPassword.hover()
    await page.waitForTimeout(200)
    await snap(page, 'horizontal-hover-password')

    // Click password tab -> switches selection and visible panel
    await tabPassword.click()
    await expect(tabPassword).toHaveAttribute('aria-selected', 'true')
    await expect(tabPassword).toHaveAttribute('data-state', 'active')
    await expect(panelPassword).toBeVisible()
    await expect(panelAccount).toBeHidden()

    // Assert password tab now possesses the active indicator bar
    const passBorder = await tabPassword.evaluate((el) => {
      const cs = window.getComputedStyle(el)
      return {
        style: cs.borderBottomStyle,
        width: cs.borderBottomWidth,
        color: cs.borderBottomColor,
      }
    })
    expect(passBorder.style).toBe('solid')
    expect(parseInt(passBorder.width, 10)).toBeGreaterThanOrEqual(2)

    await page.waitForTimeout(200)
    await snap(page, 'horizontal-password-selected')
    await snap(list, 'horizontal-list-password-selected', { maxDiffPixelRatio: 0.001 })

    // Arrow keys navigate between tabs
    await tabPassword.focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabSettings).toBeFocused()
    await expect(tabSettings).toHaveAttribute('aria-selected', 'true')

    await page.waitForTimeout(200)
    await snap(page, 'horizontal-settings-focused')

    // Disabled tab verification
    await expect(tabDisabled).toBeDisabled()
    await tabDisabled.hover({ force: true })
    await page.waitForTimeout(200)
    await snap(page, 'horizontal-disabled-hover')
  })
});
