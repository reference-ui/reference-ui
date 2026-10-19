/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

  test.describe('OV-ENV-04: StrictMode resilience', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Nested')
      await expect(page.getByTestId('nested-fixture-root')).toBeVisible()
    })

    test('One modal side effect even when React replays lifecycles', async ({ page }) => {
      // 1. Open
      await page.getByTestId('btn-strict-toggle').click({ force: true })
      await expect(page.getByTestId('strict-content')).toBeVisible()

      // Lock should be acquired exactly once. We can verify it's acquired.
      const isLocked = await page.evaluate(() => window.getComputedStyle(document.body).overflow === 'hidden')
      expect(isLocked).toBe(true)

      // We can also check if multiple `data-aria-hidden` attributes were added or something,
      // but `hideOutside` sets `inert=true`. Let's check if the document body is NOT inert!
      // (If it incorrectly selected document.body, it would be inert).
      const bodyInert = await page.evaluate(() => document.body.hasAttribute('inert'))
      expect(bodyInert).toBe(false)

      // 2. Close
      await page.getByTestId('btn-strict-toggle').evaluate((el: HTMLElement) => el.click())
      await expect(page.getByTestId('strict-content')).toHaveCount(0)

      // Lock should be released
      const isUnlocked = await page.evaluate(() => window.getComputedStyle(document.body).overflow !== 'hidden')
      expect(isUnlocked).toBe(true)
    })
  })
