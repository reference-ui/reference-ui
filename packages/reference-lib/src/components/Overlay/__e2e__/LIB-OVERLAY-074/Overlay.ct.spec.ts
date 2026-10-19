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
    test('OV-PRES-04: Completes close immediately with zero/no-animation styles or reduced motion', async ({ mount, page, }) => {
      await mount('components/Overlay/Overlay/Dialog')

      // Case 1: zero/no-motion styles
      await page.getByTestId('btn-open-pres-no-motion').click()
      const noMotionContent = page.getByTestId('dialog-pres-no-motion-content')
      await expect(noMotionContent).toBeVisible()

      const startTime = Date.now()
      await page.getByTestId('btn-close-pres-no-motion').click()
      await expect(noMotionContent).toHaveCount(0, { timeout: 500 })
      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(400) // Unmounts immediately, no 5s timeout

      // Case 2: Reduced motion emulation
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.getByTestId('btn-open-pres-equal').click()
      const equalContent = page.getByTestId('dialog-pres-equal-content')
      await expect(equalContent).toBeVisible()

      const reducedStart = Date.now()
      await page.getByTestId('btn-close-pres-equal').click()
      await expect(equalContent).toHaveCount(0, { timeout: 500 })
      const reducedElapsed = Date.now() - reducedStart
      expect(reducedElapsed).toBeLessThan(400) // Unmounts immediately under reduced motion
    })
  })
})
