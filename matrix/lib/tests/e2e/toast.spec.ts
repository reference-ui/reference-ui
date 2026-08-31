import { expect, test } from '@playwright/test'

test.describe('Toast Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/toast')
    await expect(page.getByTestId('toast-fixture-root')).toBeVisible()
  })

  test('TO-DOM-01 & TO-DEF-01: Displays defined toast, updates content in place, and dismisses', async ({
    page,
  }) => {
    const toastRoot = page.getByTestId('defined-toast-root')
    const toastTitle = page.getByTestId('defined-toast-title')

    await expect(toastRoot).toHaveCount(0)

    // Show defined toast
    await page.getByTestId('btn-show-defined-toast').click()
    await expect(toastRoot).toBeVisible()
    await expect(toastRoot).toHaveAttribute('data-type', 'success')
    await expect(toastTitle).toHaveText('Project saved successfully!')

    // Update toast in place
    await page.getByTestId('btn-update-toast').click()
    await expect(toastTitle).toHaveText('Project synchronized with cloud!')

    // Dismiss toast
    await page.getByTestId('btn-dismiss-toast').click()
    await expect(toastRoot).toHaveCount(0)
  })
})
