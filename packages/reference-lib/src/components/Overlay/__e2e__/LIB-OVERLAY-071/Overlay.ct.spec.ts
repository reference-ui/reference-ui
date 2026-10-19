/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('10. Presence & Exit Lifecycle', () => {
    test('OV-PRES-01: Keeps both Backdrop and Content mounted with data-state="closed" during owned CSS exit', async ({ mount, page, }) => {
      await mount('components/Overlay/Overlay/Dialog')
      await page.getByTestId('btn-open-pres-equal').click()
      const backdrop = page.getByTestId('dialog-pres-equal-backdrop')
      const content = page.getByTestId('dialog-pres-equal-content')
      await expect(backdrop).toBeVisible()
      await expect(content).toBeVisible()
      await expect(backdrop).toHaveAttribute('data-state', 'open')
      await expect(content).toHaveAttribute('data-state', 'open')

      // Close dialog
      await page.getByTestId('btn-close-pres-equal').click()

      // Immediately after close, both parts must have data-state="closed" AND remain mounted in the DOM
      await expect(backdrop).toHaveAttribute('data-state', 'closed')
      await expect(content).toHaveAttribute('data-state', 'closed')
      await expect(backdrop).toBeVisible()
      await expect(content).toBeVisible()

      // Wait for the 150ms animation to finish
      await expect(content).toHaveCount(0, { timeout: 3000 })
      await expect(backdrop).toHaveCount(0, { timeout: 3000 })
    })
  })
})
