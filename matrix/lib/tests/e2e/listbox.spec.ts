import { expect, test } from '@playwright/test'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/listbox')
    await expect(page.getByTestId('listbox-fixture-root')).toBeVisible()
  })

  test('LB-DOM-01: Renders listbox and options, selects option on click and updates state', async ({
    page,
  }) => {
    const listbox = page.getByTestId('test-listbox')
    const optApple = page.getByTestId('opt-apple')
    const optBanana = page.getByTestId('opt-banana')
    const display = page.getByTestId('listbox-value-display')

    await expect(listbox).toHaveAttribute('role', 'listbox')
    await expect(optApple).toHaveAttribute('role', 'option')
    await expect(optApple).toHaveAttribute('aria-selected', 'true')
    await expect(optApple).toHaveAttribute('data-state', 'selected')
    await expect(optBanana).toHaveAttribute('aria-selected', 'false')
    await expect(optBanana).toHaveAttribute('data-state', 'unselected')
    await expect(display).toHaveText('Selected: apple')

    // Click Banana -> selects banana
    await optBanana.click()
    await expect(optBanana).toHaveAttribute('aria-selected', 'true')
    await expect(optBanana).toHaveAttribute('data-state', 'selected')
    await expect(optApple).toHaveAttribute('aria-selected', 'false')
    await expect(optApple).toHaveAttribute('data-state', 'unselected')
    await expect(display).toHaveText('Selected: banana')
  })
})
