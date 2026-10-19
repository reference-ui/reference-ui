/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('OV-POS-07 / OV-POS-08: Living geometry', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Anchor')
      await expect(page.getByTestId('anchor-fixture-root')).toBeVisible()
    })

    test('OV-POS-08: Overlay keeps a living position while open', async ({ page }) => {
      const scroller = page.getByTestId('pos-08-scroller')
      const content = page.getByTestId('content-pos-08')

      await page.getByTestId('anchor-target-pos-08').evaluate((el: HTMLElement) => {
        el.scrollIntoView({ block: 'center' })
      })
      await page.getByTestId('anchor-target-pos-08').click()
      await expect(content).toBeVisible()

      const before = await content.evaluate(el => ({
        top: (el as HTMLElement).style.top,
        left: (el as HTMLElement).style.left,
      }))

      await scroller.evaluate(el => {
        el.scrollTop += 40
      })
      await page.waitForFunction(
        (prev: { top: string; left: string }) => {
          const el = document.querySelector('[data-testid="content-pos-08"]') as HTMLElement | null
          if (!el) return false
          return el.style.top !== prev.top || el.style.left !== prev.left
        },
        before
      )

      const afterScroll = await content.evaluate(el => ({
        top: (el as HTMLElement).style.top,
        left: (el as HTMLElement).style.left,
      }))
      expect(afterScroll.top !== before.top || afterScroll.left !== before.left).toBe(true)

      await page.evaluate(() => {
        window.visualViewport?.dispatchEvent(new Event('resize'))
        window.dispatchEvent(new Event('resize'))
      })
      await expect(content).toBeVisible()
      await expect(page.getByTestId('pos-08-log')).not.toContainText('dismiss')

      await page.getByTestId('btn-close-pos-08').click()
      await expect(content).toHaveCount(0)
    })
  })
})
