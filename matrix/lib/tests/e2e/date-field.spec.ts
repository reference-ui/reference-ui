import { expect, test } from '@playwright/test'

test.describe('DateField Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/date-field')
    await expect(page.getByTestId('date-field-fixture-root')).toBeVisible()
  })

  test('DF-DOM-02: Renders compound DateField, opens picker on trigger click, selects date and updates', async ({
    page,
  }) => {
    const input = page.getByTestId('date-field-input')
    const trigger = page.getByTestId('date-field-trigger')
    const picker = page.getByTestId('date-field-picker')
    const display = page.getByTestId('date-field-value-display')

    await expect(input).toHaveValue('2026-08-15')
    await expect(display).toHaveText('Date Value: 2026-08-15')
    await expect(picker).toHaveCount(0)

    // Click trigger -> opens picker
    await trigger.click()
    await expect(picker).toBeVisible()

    // Find and click August 25, 2026
    const day25 = page.locator('button[data-date="2026-08-25"]')
    await expect(day25).toBeVisible()
    await day25.click()

    await expect(picker).toHaveCount(0)
    await expect(input).toHaveValue('2026-08-25')
    await expect(display).toHaveText('Date Value: 2026-08-25')
  })
})
