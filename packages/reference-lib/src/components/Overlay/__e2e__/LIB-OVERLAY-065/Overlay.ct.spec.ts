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

    test('OV-POS-03: Flips and shifts anchored Content instead of overflowing', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      const anchor = page.getByTestId('anchor-target-edge')
      await anchor.click()

      // 1. Flip & shift enabled
      const enabledContent = page.getByTestId('content-flip-shift-enabled')
      await expect(enabledContent).toBeVisible()

      const anchorBox = (await anchor.boundingBox())!
      const enabledBox = (await enabledContent.boundingBox())!

      // Bottom would overflow viewport (anchor is at y=680 in 720h viewport), so it must flip to top
      await expect(enabledContent).toHaveAttribute('data-side', 'top')
      expect(enabledBox.y + enabledBox.height).toBeLessThanOrEqual(anchorBox.y)

      // Shift should keep content within viewport bounds
      const viewport = page.viewportSize()!
      expect(enabledBox.x + enabledBox.width).toBeLessThanOrEqual(viewport.width)

      await page.getByTestId('btn-close-flip-shift').click()
      await expect(enabledContent).toHaveCount(0)

      // 2. Flip & shift disabled
      await page.getByTestId('btn-open-no-flip-no-shift').click()
      const disabledContent = page.getByTestId('content-flip-shift-disabled')
      await expect(disabledContent).toBeVisible()

      const disabledBox = (await disabledContent.boundingBox())!
      // Must NOT flip: side stays 'bottom'
      await expect(disabledContent).toHaveAttribute('data-side', 'bottom')
      expect(disabledBox.y).toBeGreaterThanOrEqual(anchorBox.y + anchorBox.height)

      await page.getByTestId('btn-close-no-flip-shift').click()
      await expect(disabledContent).toHaveCount(0)
    })
  })
})
