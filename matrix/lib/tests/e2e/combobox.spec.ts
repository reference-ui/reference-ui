import { expect, test } from '@playwright/test'

test.describe('Combobox Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/combobox')
    await expect(page.getByTestId('combobox-fixture-root')).toBeVisible()
  })

  test('CB-DOM-01: Renders combobox input, opens popover on focus/click, selects option and closes', async ({
    page,
  }) => {
    const input = page.getByTestId('combobox-input')
    const popover = page.getByTestId('combobox-popover')
    const display = page.getByTestId('combobox-value-display')

    await expect(input).toHaveAttribute('role', 'combobox')
    await expect(input).toHaveAttribute('aria-autocomplete', 'list')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(popover).toHaveCount(0)

    // Focus input -> opens popover
    await input.click()
    await expect(input).toHaveAttribute('aria-expanded', 'true')
    await expect(popover).toBeVisible()

    const optBanana = page.getByTestId('combo-opt-banana')
    await expect(optBanana).toBeVisible()

    // Click Banana option -> selects banana and closes popover
    await optBanana.click()
    await expect(popover).toHaveCount(0)
    await expect(input).toHaveValue('banana')
    await expect(display).toHaveText('Selected: banana')
  })
})
