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

    test('OV-SCROLL-02: Overlay avoids layout shift when locking page with scrollbar and authored root styles', async ({ mount, page, }) => {
      // 1. Author initial styles and add fixed element to record rect
      await page.evaluate(() => {
        document.documentElement.style.overflow = 'scroll'
        document.documentElement.style.setProperty('scrollbar-gutter', 'stable')
        document.body.style.margin = '12px'
        document.body.style.setProperty('padding-right', '16px', 'important')

        const fixed = document.createElement('div')
        fixed.id = 'ov-fixed-shift-probe'
        fixed.style.position = 'fixed'
        fixed.style.top = '10px'
        fixed.style.right = '20px'
        fixed.style.width = '120px'
        fixed.style.height = '40px'
        fixed.style.background = 'pink'
        document.body.appendChild(fixed)
      })

      const probe = page.locator('#ov-fixed-shift-probe')
      const beforeRect = (await probe.boundingBox())!

      // 2. Open isolating overlay
      await page.getByTestId('btn-open-at-scroll').click()
      const content = page.getByTestId('scroll-content')
      await expect(content).toBeVisible()

      // While open: fixed probe bounding box must NOT shift
      const duringRect = (await probe.boundingBox())!
      expect(Math.abs(duringRect.x - beforeRect.x)).toBeLessThanOrEqual(1)
      expect(Math.abs(duringRect.y - beforeRect.y)).toBeLessThanOrEqual(1)

      // Body overflow is locked to hidden
      expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')

      // 3. Close overlay
      await page.getByTestId('btn-close-scroll-dialog').click()
      await expect(content).toHaveCount(0)

      // 4. Assert every authored value and priority restores exactly
      const restored = await page.evaluate(() => ({
        htmlOverflow: document.documentElement.style.overflow,
        htmlScrollbarGutter: document.documentElement.style.getPropertyValue('scrollbar-gutter'),
        bodyMargin: document.body.style.margin,
        bodyPadRight: document.body.style.getPropertyValue('padding-right'),
        bodyPadPriority: document.body.style.getPropertyPriority('padding-right'),
      }))

      expect(restored.htmlOverflow).toBe('scroll')
      expect(restored.htmlScrollbarGutter).toBe('stable')
      expect(restored.bodyMargin).toBe('12px')
      expect(restored.bodyPadRight).toBe('16px')
      expect(restored.bodyPadPriority).toBe('important')

      // Probe still at identical position
      const afterRect = (await probe.boundingBox())!
      expect(Math.abs(afterRect.x - beforeRect.x)).toBeLessThanOrEqual(1)
      expect(Math.abs(afterRect.y - beforeRect.y)).toBeLessThanOrEqual(1)

      // Cleanup probe
      await page.evaluate(() => {
        document.getElementById('ov-fixed-shift-probe')?.remove()
        document.documentElement.style.overflow = ''
        document.documentElement.style.removeProperty('scrollbar-gutter')
        document.body.style.margin = ''
        document.body.style.removeProperty('padding-right')
      })
    })
  })
})
