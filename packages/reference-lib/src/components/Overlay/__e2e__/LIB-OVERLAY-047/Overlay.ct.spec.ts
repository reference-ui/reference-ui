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

    test('OV-HND-03: Keeps overflowing Content scrollable while Handle interaction remains distinct', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-edge-bottom').click()
      const content = page.getByTestId('edge-content')
      await expect(content).toBeVisible()

      const inner = page.getByTestId('edge-scroll-inner')
      await expect(inner).toBeVisible()

      // Initial scroll state
      const initialScroll = await inner.evaluate(el => el.scrollTop)
      expect(initialScroll).toBe(0)

      // 1. Swipe inner overflowing Content -> scrolls Content, does not dismiss
      const innerBox = await inner.boundingBox()
      expect(innerBox).toBeTruthy()
      await page.mouse.move(innerBox!.x + innerBox!.width / 2, innerBox!.y + innerBox!.height / 2)
      await page.mouse.wheel(0, 100)

      await page.waitForFunction(
        () => (document.querySelector('[data-testid="edge-scroll-inner"]') as HTMLElement)?.scrollTop > 0,
        null,
        { timeout: 3000 }
      )
      const scrolled = await inner.evaluate(el => el.scrollTop)
      expect(scrolled).toBeGreaterThan(0)
      // Content must still be open!
      await expect(content).toBeVisible()

      // 2. Underlying document must not have scrolled
      const docScroll = await page.evaluate(() => window.scrollY)
      expect(docScroll).toBe(0)

      // 3. Swipe Handle through dismiss threshold -> dismisses
      const handle = page.getByTestId('edge-handle')
      const handleBox = await handle.boundingBox()
      expect(handleBox).toBeTruthy()

      await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2)
      await page.mouse.down()
      await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + 150, { steps: 10 })
      await page.mouse.up()

      await expect(content).toHaveCount(0)
      // Document scroll still 0
      const finalDocScroll = await page.evaluate(() => window.scrollY)
      expect(finalDocScroll).toBe(0)
    })
  })
})
