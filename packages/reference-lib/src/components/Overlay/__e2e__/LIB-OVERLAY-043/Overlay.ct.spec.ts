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

    test('OV-HND-VISUAL: Edge sheet renders visible pill handle with non-transparent background and snapshot proof', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-edge-bottom').click()
      const content = page.getByTestId('edge-content')
      await expect(content).toBeVisible()

      const handle = page.getByTestId('edge-handle')
      await expect(handle).toBeVisible()

      // Handle pill background must be visible (not transparent or rgba(0,0,0,0))
      const bg = await handle.evaluate((el) => {
        const inner = (el.firstElementChild as HTMLElement) || el
        return window.getComputedStyle(inner).backgroundColor
      })
      expect(bg).not.toBe('rgba(0, 0, 0, 0)')
      expect(bg).not.toBe('transparent')

      await page.waitForTimeout(300)
      await snap(handle, 'edge-sheet-handle-pill', { maxDiffPixels: 5 })
      await snap(content, 'edge-sheet-content-with-handle', { maxDiffPixelRatio: 0.002 })
    })
  })
})
