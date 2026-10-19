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

    test('OV-POS-06: Overlay publishes available and anchor geometry CSS variables for scrolling popups', async ({
      page,
    }) => {
      const anchor = page.getByTestId('anchor-target-pos-06')
      await anchor.evaluate((el: HTMLElement) => el.scrollIntoView({ block: 'center' }))
      await anchor.click()

      const content = page.getByTestId('content-pos-06')
      await expect(content).toBeVisible()

      const anchorBox = (await anchor.boundingBox())!

      const vars = await content.evaluate(el => {
        const style = (el as HTMLElement).style
        return {
          availWidth: style.getPropertyValue('--reference-overlay-available-width'),
          availHeight: style.getPropertyValue('--reference-overlay-available-height'),
          anchorWidth: style.getPropertyValue('--reference-overlay-anchor-width'),
          anchorHeight: style.getPropertyValue('--reference-overlay-anchor-height'),
          transformOrigin: style.getPropertyValue('--reference-overlay-transform-origin'),
        }
      })

      // Finite non-negative values
      const availW = parseFloat(vars.availWidth)
      const availH = parseFloat(vars.availHeight)
      expect(Number.isFinite(availW) && availW > 0).toBe(true)
      expect(Number.isFinite(availH) && availH > 0).toBe(true)

      // Anchor dimensions match exactly
      expect(vars.anchorWidth).toBe(`${anchorBox.width}px`)
      expect(vars.anchorHeight).toBe(`${anchorBox.height}px`)

      // Transform origin published
      expect(['0 0', '0 100%']).toContain(vars.transformOrigin)

      await page.getByTestId('btn-close-pos-06').click()
      await expect(content).toHaveCount(0)
    })
  })
})
