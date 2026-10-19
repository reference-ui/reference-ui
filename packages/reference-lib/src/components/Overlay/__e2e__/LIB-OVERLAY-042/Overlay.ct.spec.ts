/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('7. Edge Sheets & Handle Gestures', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Edge')
      await expect(page.getByTestId('edge-fixture-root')).toBeVisible()
    })

    test('OV-EDGE-01: Binds to all four edges correctly', async ({
      page,
    }) => {
      // Bottom edge
      await page.getByTestId('btn-open-edge-bottom').click()
      let content = page.getByTestId('edge-content')
      await expect(content).toBeVisible()
      await expect(content).toHaveAttribute('data-edge', 'bottom')
      await page.getByTestId('btn-close-edge').click()
      await expect(content).toHaveCount(0)

      // Top edge
      await page.getByTestId('btn-open-edge-top').click()
      content = page.getByTestId('edge-content')
      await expect(content).toBeVisible()
      await expect(content).toHaveAttribute('data-edge', 'top')
      await page.getByTestId('btn-close-edge').click()
      await expect(content).toHaveCount(0)

      // Left edge
      await page.getByTestId('btn-open-edge-left').click()
      content = page.getByTestId('edge-content')
      await expect(content).toBeVisible()
      await expect(content).toHaveAttribute('data-edge', 'left')
      await page.getByTestId('btn-close-edge').click()
      await expect(content).toHaveCount(0)

      // Right edge
      await page.getByTestId('btn-open-edge-right').click()
      content = page.getByTestId('edge-content')
      await expect(content).toBeVisible()
      await expect(content).toHaveAttribute('data-edge', 'right')
      await page.getByTestId('btn-close-edge').click()
      await expect(content).toHaveCount(0)
    })
  })
})
