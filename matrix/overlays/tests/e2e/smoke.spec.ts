import { expect, test } from '@playwright/test'

test.describe('Overlays Matrix Smoke', () => {
  test('renders overlays root', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('overlays-root')).toBeVisible()
  })
})
