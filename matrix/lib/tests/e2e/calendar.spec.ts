import { expect, test } from '@playwright/test'

test.describe('Calendar Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar')
    await expect(page.getByTestId('calendar-fixture-root')).toBeVisible()
  })

  test('CA-ISO-01: Renders calendar grid, selects date on click and updates state', async ({
    page,
  }) => {
    const calendar = page.getByTestId('test-calendar')
    const display = page.getByTestId('calendar-value-display')

    await expect(calendar).toBeVisible()
    await expect(display).toHaveText('Selected Date: 2026-08-15')

    // Find and click August 20, 2026
    const day20 = page.locator('button[data-date="2026-08-20"]')
    await expect(day20).toBeVisible()
    await day20.click()

    await expect(day20).toHaveAttribute('data-selected', '')
    await expect(display).toHaveText('Selected Date: 2026-08-20')
  })
})
