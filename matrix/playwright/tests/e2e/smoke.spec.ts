import { expect, test } from '@playwright/test'
import { Div } from '@reference-ui/react'
import { matrixPlaywrightMarker } from '../../src/index'

test('ref sync exposes runtime packages and Playwright can launch a browser', async ({ page }) => {
  expect(Div).toBeTruthy()
  expect(matrixPlaywrightMarker).toBe('reference-ui-matrix-playwright')

  await page.goto('/')

  await expect(page.getByTestId('playwright-root')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Reference UI Playwright matrix' })).toBeVisible()
  await expect(page.getByText('Playwright is rendering real Reference UI primitives through the matrix fixture.')).toBeVisible()
})