import { expect, test } from '@playwright/test'

test.describe('Tabs Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tabs')
    await expect(page.getByTestId('tabs-fixture-root')).toBeVisible()
  })

  test('TB-DOM-01, TB-DOM-03 & TB-DOM-04: Renders tablist, tabs and panels with active selection and ARIA linkage', async ({
    page,
  }) => {
    const tabAccount = page.getByTestId('tab-account')
    const panelAccount = page.getByTestId('panel-account')
    const tabPassword = page.getByTestId('tab-password')
    const panelPassword = page.getByTestId('panel-password')

    await expect(tabAccount).toHaveAttribute('role', 'tab')
    await expect(tabAccount).toHaveAttribute('aria-selected', 'true')
    await expect(tabAccount).toHaveAttribute('data-state', 'active')
    await expect(panelAccount).toBeVisible()
    await expect(panelAccount).toHaveAttribute('role', 'tabpanel')

    await expect(tabPassword).toHaveAttribute('aria-selected', 'false')
    await expect(tabPassword).toHaveAttribute('data-state', 'inactive')
    await expect(panelPassword).toBeHidden()

    // Click password tab -> switches selection and visible panel
    await tabPassword.click()
    await expect(tabPassword).toHaveAttribute('aria-selected', 'true')
    await expect(tabPassword).toHaveAttribute('data-state', 'active')
    await expect(panelPassword).toBeVisible()
    await expect(panelAccount).toBeHidden()

    // Arrow keys navigate between tabs
    await tabPassword.focus()
    await page.keyboard.press('ArrowRight')
    const tabSettings = page.getByTestId('tab-settings')
    await expect(tabSettings).toBeFocused()
    await expect(tabSettings).toHaveAttribute('aria-selected', 'true')
  })
})
