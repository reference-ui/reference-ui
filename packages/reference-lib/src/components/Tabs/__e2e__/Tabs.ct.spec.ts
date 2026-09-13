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

    await expect(tabPassword).toHaveAttribute('aria-selected', 'false')
    await expect(tabPassword).toHaveAttribute('data-state', 'inactive')
    await expect(panelPassword).toBeHidden()

    await page.waitForTimeout(300)
    await snap(page, 'horizontal-default')

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

    await page.waitForTimeout(200)
    await snap(page, 'horizontal-password-selected')

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

    await page.waitForTimeout(300)
    await snap(page, 'vertical-default')

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

    await expect(tabOverview).toHaveAttribute('aria-selected', 'true')
    await expect(tabOverview).toHaveAttribute('data-variant', 'pill')

    await page.waitForTimeout(300)
    await snap(page, 'pill-default')

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

    // Focus state
    await tabActivity.focus()
    await page.waitForTimeout(200)
    await snap(page, 'pill-activity-focused')
  })
})
