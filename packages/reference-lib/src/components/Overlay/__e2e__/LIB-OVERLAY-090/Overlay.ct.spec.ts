/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('OV-SCROLL-04: Portalled shard scrolling', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Scroll')
      await expect(page.getByTestId('scroll-fixture-root')).toBeVisible()
    })

    test('OV-SCROLL-04: Overlay applies the same edge-aware scrolling rules when the scrollable is in a registered portalled shard', async ({ mount, page, }) => {
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.getByTestId('section-ov-scroll-04').scrollIntoViewIfNeeded()
      await page.getByTestId('btn-open-shard-scroll').click({ force: true })
      await expect(page.getByTestId('shard-scroll-parent-content')).toBeVisible()
      await page.getByTestId('btn-open-shard-scroll-child').click()
      const inner = page.getByTestId('shard-scroll-inner')
      await expect(inner).toBeVisible()

      const pageY = await page.evaluate(() => window.scrollY)
      const bg = page.getByTestId('bg-scroller-unregistered')
      const bgStart = await bg.evaluate(el => el.scrollTop)

      const box = await inner.boundingBox()
      expect(box).toBeTruthy()
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
      await page.mouse.wheel(0, 80)
      await page.waitForFunction(
        () => (document.querySelector('[data-testid="shard-scroll-inner"]') as HTMLElement)?.scrollTop > 0
      )

      const mid = await inner.evaluate(el => el.scrollTop)
      expect(mid).toBeGreaterThan(0)
      expect(await page.evaluate(() => window.scrollY)).toBe(pageY)
      expect(await bg.evaluate(el => el.scrollTop)).toBe(bgStart)

      await inner.evaluate(el => {
        el.scrollTop = el.scrollHeight
      })
      const atEdge = await inner.evaluate(el => el.scrollTop)
      await page.mouse.wheel(0, 120)
      expect(await page.evaluate(() => window.scrollY)).toBe(pageY)
      expect(await inner.evaluate(el => el.scrollTop)).toBeGreaterThanOrEqual(atEdge - 1)
      expect(await bg.evaluate(el => el.scrollTop)).toBe(bgStart)

      const bgBox = await bg.boundingBox()
      if (bgBox) {
        await page.mouse.move(bgBox.x + bgBox.width / 2, bgBox.y + bgBox.height / 2)
        await page.mouse.wheel(0, 80)
      }
      expect(await page.evaluate(() => window.scrollY)).toBe(pageY)
      expect(await bg.evaluate(el => el.scrollTop)).toBe(bgStart)
    })
  })
})
