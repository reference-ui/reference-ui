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

    test('OV-POS-04: Honors explicit offset, collisionPadding, and strategy="fixed"', async ({
      page,
    }) => {
      const anchor = page.getByTestId('anchor-target-custom')
      await anchor.click()

      const content = page.getByTestId('content-pos-custom')
      await expect(content).toBeVisible()

      const anchorBox = (await anchor.boundingBox())!
      const contentBox = (await content.boundingBox())!

      // Strategy: fixed
      const inline = await content.evaluate(el => ({
        position: (el as HTMLElement).style.position,
        transform: (el as HTMLElement).style.transform,
      }))
      expect(inline.position).toBe('fixed')
      expect(inline.transform).toBe('scale(1.05)')

      // Explicit offset = 24
      expect(Math.abs(contentBox.y - (anchorBox.y + anchorBox.height + 24))).toBeLessThanOrEqual(2)

      await page.getByTestId('btn-close-pos-custom').click()
      await expect(content).toHaveCount(0)
    })
  })
})
