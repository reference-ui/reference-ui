import { expect, test } from '@playwright/test'

test.describe('Overlay Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/overlay')
    await expect(page.getByTestId('overlay-fixture-root')).toBeVisible()
  })

  test('OV-DOM-01 & OV-DOM-05: Renders no portal content initially, renders Backdrop and Content upon open', async ({
    page,
  }) => {
    const backdrop = page.getByTestId('overlay-backdrop')
    const content = page.getByTestId('overlay-content')

    await expect(backdrop).toHaveCount(0)
    await expect(content).toHaveCount(0)

    // Click trigger to open
    await page.getByTestId('btn-open-overlay').click()

    await expect(backdrop).toBeVisible()
    await expect(content).toBeVisible()
    await expect(content.getByTestId('overlay-title')).toHaveText('Dialog Title')

    // Close
    await page.getByTestId('btn-close-overlay').click()
    await expect(content).toHaveCount(0)
  })

  test('Escape key dismisses the overlay', async ({ page }) => {
    await page.getByTestId('btn-open-overlay').click()
    const content = page.getByTestId('overlay-content')
    await expect(content).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(content).toHaveCount(0)
  })

  test('Clicking backdrop dismisses the overlay', async ({ page }) => {
    await page.getByTestId('btn-open-overlay').click()
    const content = page.getByTestId('overlay-content')
    const backdrop = page.getByTestId('overlay-backdrop')
    await expect(content).toBeVisible()

    // Click on the backdrop (e.g. top-left corner)
    await backdrop.click({ position: { x: 10, y: 10 } })
    await expect(content).toHaveCount(0)
  })

  test('Focus is trapped inside overlay content while open', async ({ page }) => {
    await page.getByTestId('btn-open-overlay').click()
    const firstAction = page.getByTestId('btn-inside-first')
    const closeBtn = page.getByTestId('btn-close-overlay')

    await expect(firstAction).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(closeBtn).toBeFocused()

    // Tab wraps back to first action
    await page.keyboard.press('Tab')
    await expect(firstAction).toBeFocused()
  })
})
