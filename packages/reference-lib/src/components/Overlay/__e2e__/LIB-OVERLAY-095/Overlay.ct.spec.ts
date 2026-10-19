/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

  test.describe('OV-INERT-03 / OV-SCROLL-05: Out of order exit', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Nested')
      await expect(page.getByTestId('nested-fixture-root')).toBeVisible()
    })

    test('Keep background hidden and document locked until the last modal finishes its exit', async ({ mount, page }) => {
      await page.getByTestId('btn-ooo-all').click()
      await expect(page.getByTestId('ooo-content-1')).toBeVisible()
      await expect(page.getByTestId('ooo-content-2')).toBeVisible()

      // The body should be locked
      const isLocked = await page.evaluate(() => {
        return window.getComputedStyle(document.body).overflow === 'hidden'
      })
      expect(isLocked).toBe(true)

      // Close both out of order (close 1 first, then 2). 
      // 1 has a 300ms transition. 2 has a 100ms transition.
      // So 2 will finish exiting before 1, even if closed after!
      await page.getByTestId('btn-ooo-close-1').evaluate((el: HTMLElement) => el.click())
      await page.getByTestId('btn-ooo-close-2').evaluate((el: HTMLElement) => el.click())

      // Wait 150ms. 2 should be unmounted. 1 should still be animating.
      await page.waitForTimeout(150)
      await expect(page.getByTestId('ooo-content-2')).toHaveCount(0)
      await expect(page.getByTestId('ooo-content-1')).toBeVisible()

      // Body should STILL be locked because 1 is still animating!
      const isStillLocked = await page.evaluate(() => {
        return window.getComputedStyle(document.body).overflow === 'hidden'
      })
      expect(isStillLocked).toBe(true)

      // Wait for 1 to finish unmounting (another 200ms should do it)
      await page.waitForTimeout(300)
      await expect(page.getByTestId('ooo-content-1')).toHaveCount(0)

      // Body should NOW be unlocked
      const isUnlocked = await page.evaluate(() => {
        return window.getComputedStyle(document.body).overflow !== 'hidden'
      })
      expect(isUnlocked).toBe(true)
    })
  })
