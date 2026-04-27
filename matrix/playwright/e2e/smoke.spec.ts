import { expect, test } from '@playwright/test'
import { Div } from '@reference-ui/react'
import { matrixPlaywrightMarker, renderPlaywrightMatrixLabel } from '../src/index'

test('ref sync exposes runtime packages and Playwright can launch a browser', async ({ page }) => {
  expect(Div).toBeTruthy()
  expect(matrixPlaywrightMarker).toBe('reference-ui-matrix-playwright')

  await page.setContent(`<main data-testid="playwright-root">${renderPlaywrightMatrixLabel()}</main>`)

  await expect(page.getByTestId('playwright-root')).toHaveText('Reference UI Playwright matrix')
})