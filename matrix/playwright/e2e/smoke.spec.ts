import { expect, test } from '@playwright/test'
import { Div } from '@reference-ui/react'

test('ref sync exposes runtime packages and Playwright can launch a browser', async ({ page }) => {
  expect(Div).toBeTruthy()

  await page.setContent('<main data-testid="playwright-root">Reference UI Playwright matrix</main>')

  await expect(page.getByTestId('playwright-root')).toHaveText('Reference UI Playwright matrix')
})