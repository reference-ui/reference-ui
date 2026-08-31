import { expect, test } from '@playwright/test'

test.describe('Splitter Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/splitter')
    await expect(page.getByTestId('splitter-fixture-root')).toBeVisible()
  })

  test('SP-DOM-01: Renders splitter panels and handle and responds to keyboard resize', async ({
    page,
  }) => {
    const handle = page.getByTestId('splitter-handle-0')
    const display = page.getByTestId('splitter-value-display')

    await expect(handle).toBeVisible()
    await expect(handle).toHaveAttribute('role', 'separator')
    await expect(handle).toHaveAttribute('aria-valuenow', '40')
    await expect(display).toHaveText('Layout: 40% / 60%')

    // Keyboard ArrowRight increases left panel by 1% -> 41% / 59%
    await handle.focus()
    await page.keyboard.press('ArrowRight')
    await expect(handle).toHaveAttribute('aria-valuenow', '41')
    await expect(display).toHaveText('Layout: 41% / 59%')

    // Keyboard Shift+ArrowRight increases by 10% -> 51% / 49%
    await page.keyboard.press('Shift+ArrowRight')
    await expect(handle).toHaveAttribute('aria-valuenow', '51')
    await expect(display).toHaveText('Layout: 51% / 49%')
  })
})
