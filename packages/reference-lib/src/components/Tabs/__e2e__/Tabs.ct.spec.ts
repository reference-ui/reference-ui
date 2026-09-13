import { test, expect, snap } from '../../../../playwright/ct'

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

  test('TB-DOM-05: Pill variant renders with pill styling and handles selection', async ({
    mount,
    page,
  }) => {
    await mount('components/Tabs/Tabs/Pill')
    await expect(page.getByTestId('tabs-pill-root')).toBeVisible()

    const tabOverview = page.getByTestId('tab-p-overview')
    const tabActivity = page.getByTestId('tab-p-activity')
    const panelActivity = page.getByTestId('panel-p-activity')
    const list = page.getByTestId('tabs-pill-list')

    await expect(tabOverview).toHaveAttribute('aria-selected', 'true')
    await expect(tabOverview).toHaveAttribute('data-variant', 'pill')

    // Assert pill active background style
    const pillBg = await tabOverview.evaluate((el) => window.getComputedStyle(el).backgroundColor)
    expect(pillBg).not.toBe('rgba(0, 0, 0, 0)')
    expect(pillBg).not.toBe('transparent')

    await page.waitForTimeout(300)
    await snap(page, 'pill-default')
    await snap(list, 'pill-list-default', { maxDiffPixelRatio: 0.001 })
    await snap(page.getByTestId('tabs-pill-root'), 'pill-root-default', { maxDiffPixelRatio: 0.001 })

    // Hover activity
    await tabActivity.hover()
    await page.waitForTimeout(200)
    await snap(page, 'pill-hover-activity')

    // Click activity
    await tabActivity.click()
    await expect(tabActivity).toHaveAttribute('aria-selected', 'true')
    await expect(panelActivity).toBeVisible()

    await page.waitForTimeout(200)
    await snap(page, 'pill-activity-selected')
    await snap(list, 'pill-list-activity-selected', { maxDiffPixelRatio: 0.001 })

    // Focus state
    await tabActivity.focus()
    await page.waitForTimeout(200)
    await snap(page, 'pill-activity-focused')
  })
})
