/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

  test.describe('OV-SCROLL-10: Interrupted teardown', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Nested')
      await expect(page.getByTestId('nested-fixture-root')).toBeVisible()
    })

    test('Clean scroll-lock effects exactly once if teardown is interrupted or reopened during exit', async ({ mount, page }) => {
      // 1. Open
      await page.evaluate(() => (document.querySelector('[data-testid="btn-interrupt-toggle"]') as HTMLElement).click())
      await expect(page.getByTestId('interrupt-content')).toBeVisible()

      // Lock should be acquired
      const isLocked1 = await page.evaluate(() => window.getComputedStyle(document.body).overflow === 'hidden')
      expect(isLocked1).toBe(true)

      // 2. Close
      await page.evaluate(() => (document.querySelector('[data-testid="btn-interrupt-toggle"]') as HTMLElement).click())

      // Wait 100ms (during 300ms exit animation)
      await page.waitForTimeout(100)

      // Lock should STILL be acquired
      const isLocked2 = await page.evaluate(() => window.getComputedStyle(document.body).overflow === 'hidden')
      expect(isLocked2).toBe(true)

      // 3. Re-open (interrupt teardown)
      await page.evaluate(() => (document.querySelector('[data-testid="btn-interrupt-toggle"]') as HTMLElement).click())

      // Lock should STILL be acquired (no flickering/dropping)
      const isLocked3 = await page.evaluate(() => window.getComputedStyle(document.body).overflow === 'hidden')
      expect(isLocked3).toBe(true)

      // Wait past the original 300ms animation timeframe (e.g. 400ms more)
      await page.waitForTimeout(400)
      
      await expect(page.getByTestId('interrupt-content')).toBeVisible()

      // Lock should STILL be acquired because it's now fully open again
      const isLocked4 = await page.evaluate(() => window.getComputedStyle(document.body).overflow === 'hidden')
      expect(isLocked4).toBe(true)

      // 4. Finally close properly
      await page.evaluate(() => (document.querySelector('[data-testid="btn-interrupt-toggle"]') as HTMLElement).click())

      // Wait for exit animation to finish (300ms + buffer)
      await page.waitForTimeout(400)
      await expect(page.getByTestId('interrupt-content')).toHaveCount(0)

      // Lock should finally be released
      const isUnlocked = await page.evaluate(() => window.getComputedStyle(document.body).overflow !== 'hidden')
      expect(isUnlocked).toBe(true)
    })
  })
