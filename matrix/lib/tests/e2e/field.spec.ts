import { expect, test } from '@playwright/test'

test.describe('Field Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/field')
    await expect(page.getByTestId('field-fixture-root')).toBeVisible()
  })

  test('FI-DOM-01, FI-DOM-02 & FI-DOM-03: Renders div[data-reference-field] with no role and sets data-status=warning', async ({
    page,
  }) => {
    const field = page.getByTestId('test-field')
    const input = page.getByTestId('field-input')

    await expect(field).toBeVisible()
    await expect(field).toHaveAttribute('data-reference-field', '')
    await expect(field).not.toHaveAttribute('role')
    await expect(field).not.toHaveAttribute('aria-invalid')

    // Enclosed input is invalid
    await expect(input).toHaveAttribute('aria-invalid', 'true')

    // Field status warning toggle
    await page.getByTestId('btn-toggle-warning').click()
    await expect(field).toHaveAttribute('data-status', 'warning')
  })
})
