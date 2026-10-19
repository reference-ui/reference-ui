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

    test('OV-SCROLL-03: Scrollable container inside Content can scroll while document is locked', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-at-scroll').click()
      const inner = page.getByTestId('scrollable-content-inner')
      await expect(inner).toBeVisible()

      const initialInnerScroll = await inner.evaluate(el => el.scrollTop)
      expect(initialInnerScroll).toBe(0)

      const box = await inner.boundingBox()
      expect(box).toBeTruthy()
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
      await page.mouse.wheel(0, 200)

      await page.waitForFunction(
        () => (document.querySelector('[data-testid="scrollable-content-inner"]') as HTMLElement)?.scrollTop > 0,
        null,
        { timeout: 3000 }
      )

      const afterInnerScroll = await inner.evaluate(el => el.scrollTop)
      expect(afterInnerScroll).toBeGreaterThan(0)
    })
  })
})
