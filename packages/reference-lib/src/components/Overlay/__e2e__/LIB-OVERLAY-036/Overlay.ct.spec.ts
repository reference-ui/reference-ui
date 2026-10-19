/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('5. Scroll Lock Mechanics', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Scroll')
      await expect(page.getByTestId('scroll-fixture-root')).toBeVisible()
    })

    test('OV-SCROLL-01: Document scroll position is preserved against background wheel', async ({
      page,
    }) => {
      await page.evaluate(() => {
        document.documentElement.style.height = 'auto'
        document.body.style.height = 'auto'
        const root = document.getElementById('root')
        if (root) root.style.height = 'auto'
        window.scrollTo(0, 240)
      })
      const before = await page.evaluate(() => window.scrollY)
      expect(before).toBe(240)

      // Open overlay using the button visible at scrolled offset 240
      await page.getByTestId('btn-open-at-scroll').evaluate((el: HTMLElement) => el.click())
      const content = page.getByTestId('scroll-content')
      await expect(content).toBeVisible()

      const locked = await page.evaluate(() => window.scrollY)
      expect(locked).toBe(before)

      // Background wheeling
      await page.mouse.move(12, 12)
      await page.mouse.wheel(0, 500)
      const afterWheel = await page.evaluate(() => window.scrollY)
      expect(afterWheel).toBe(before)

      await page.getByTestId('btn-close-scroll-dialog').click()
      await expect(content).toHaveCount(0)
    })
  })
})
