import { expect, test } from '@playwright/test'

test.describe('NumberField Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/number-field')
    await expect(page.getByTestId('number-field-fixture-root')).toBeVisible()
  })

  test('NF-DOM-01: Renders spinbutton, steppers, and increments/decrements via keyboard and buttons', async ({
    page,
  }) => {
    const input = page.getByTestId('number-field-input')
    const btnInc = page.getByTestId('btn-increment')
    const btnDec = page.getByTestId('btn-decrement')
    const display = page.getByTestId('number-field-value-display')

    await expect(input).toHaveAttribute('role', 'spinbutton')
    await expect(input).toHaveAttribute('aria-valuenow', '42')
    await expect(input).toHaveValue('42')
    await expect(display).toHaveText('Numeric Value: 42')

    // Click increment -> 43
    await btnInc.click()
    await expect(input).toHaveValue('43')
    await expect(display).toHaveText('Numeric Value: 43')

    // Click decrement -> 42
    await btnDec.click()
    await expect(input).toHaveValue('42')
    await expect(display).toHaveText('Numeric Value: 42')

    // Keyboard ArrowUp -> 43
    await input.focus()
    await page.keyboard.press('ArrowUp')
    await expect(input).toHaveValue('43')
    await expect(display).toHaveText('Numeric Value: 43')
  })
})
