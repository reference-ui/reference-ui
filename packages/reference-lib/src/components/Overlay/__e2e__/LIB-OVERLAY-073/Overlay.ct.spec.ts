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
    test('OV-PRES-02: Waits for slower part (Backdrop 100ms, Content 250ms)', async ({ mount, page, }) => {
      await mount('components/Overlay/Overlay/Dialog')
      await page.getByTestId('btn-open-pres-content-slower').click()
      const backdrop = page.getByTestId('dialog-pres-content-slower-backdrop')
      const content = page.getByTestId('dialog-pres-content-slower-content')
      await expect(backdrop).toBeVisible()
      await expect(content).toBeVisible()

      // Close dialog
      await page.getByTestId('btn-close-pres-content-slower').click()

      // At 120ms (Backdrop's 100ms exit is complete, but Content's 250ms exit is still running)
      await page.waitForTimeout(120)

      // Backdrop MUST NOT tear down early! Both parts must remain mounted in DOM
      await expect(backdrop).toBeVisible()
      await expect(content).toBeVisible()

      // After Content 250ms completes, both unmount together
      await expect(content).toHaveCount(0, { timeout: 3000 })
      await expect(backdrop).toHaveCount(0, { timeout: 3000 })
    })
  })
})
