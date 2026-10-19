/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('Anchored Floating UI & Arrow Contracts (OV-POS-*)', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Anchor')
      await expect(page.getByTestId('anchor-fixture-root')).toBeVisible()
    })

    test('OV-POS-02: Positions Content from anchor with frozen defaults (bottom-start, 8px offset, CSS vars)', async ({
      page,
    }) => {
      const anchor = page.getByTestId('anchor-target-defaults')
      await anchor.click()

      const content = page.getByTestId('content-pos-defaults')
      await expect(content).toBeVisible()

      const anchorBox = (await anchor.boundingBox())!
      const contentBox = (await content.boundingBox())!

      // Default bottom-start: top of content should be anchor.bottom + 8px offset
      expect(Math.abs(contentBox.y - (anchorBox.y + anchorBox.height + 8))).toBeLessThanOrEqual(2)
      // Start aligned: x of content matches x of anchor
      expect(Math.abs(contentBox.x - anchorBox.x)).toBeLessThanOrEqual(2)

      // Data attributes
      await expect(content).toHaveAttribute('data-side', 'bottom')
      await expect(content).toHaveAttribute('data-align', 'start')

      // Position absolute
      const positionStyle = await content.evaluate(el => (el as HTMLElement).style.position)
      expect(positionStyle).toBe('absolute')

      // Published CSS variables
      const cssVars = await content.evaluate(el => {
        const style = (el as HTMLElement).style
        return {
          availableWidth: style.getPropertyValue('--reference-overlay-available-width'),
          availableHeight: style.getPropertyValue('--reference-overlay-available-height'),
          anchorWidth: style.getPropertyValue('--reference-overlay-anchor-width'),
          anchorHeight: style.getPropertyValue('--reference-overlay-anchor-height'),
          transformOrigin: style.getPropertyValue('--reference-overlay-transform-origin'),
        }
      })

      expect(parseFloat(cssVars.availableWidth)).toBeGreaterThan(0)
      expect(parseFloat(cssVars.availableHeight)).toBeGreaterThan(0)
      expect(parseFloat(cssVars.anchorWidth)).toBe(anchorBox.width)
      expect(parseFloat(cssVars.anchorHeight)).toBe(anchorBox.height)
      expect(cssVars.transformOrigin).toBe('0 0')

      await page.getByTestId('btn-close-pos-defaults').click()
      await expect(content).toHaveCount(0)
    })
  })
})
