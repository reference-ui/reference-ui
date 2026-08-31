import { expect, test } from '@playwright/test'

test.describe('Slider Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/slider')
    await expect(page.getByTestId('slider-fixture-root')).toBeVisible()
  })

  test('SD-DOM-01 & SD-DOM-02: Renders slider parts and updates value via keyboard arrows', async ({
    page,
  }) => {
    const thumb = page.getByTestId('slider-thumb')
    const display = page.getByTestId('slider-value-display')

    await expect(thumb).toHaveAttribute('role', 'slider')
    await expect(thumb).toHaveAttribute('aria-valuemin', '0')
    await expect(thumb).toHaveAttribute('aria-valuemax', '100')
    await expect(thumb).toHaveAttribute('aria-valuenow', '30')
    await expect(display).toHaveText('Current value: 30')

    // Keyboard ArrowRight increases by step (5) -> 35
    await thumb.focus()
    await page.keyboard.press('ArrowRight')
    await expect(thumb).toHaveAttribute('aria-valuenow', '35')
    await expect(display).toHaveText('Current value: 35')

    // Keyboard ArrowLeft decreases by step (5) -> 30
    await page.keyboard.press('ArrowLeft')
    await expect(thumb).toHaveAttribute('aria-valuenow', '30')
    await expect(display).toHaveText('Current value: 30')
  })
})
