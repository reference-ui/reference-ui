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

    test('OV-EDGE-03: Overlay treats Trigger as opener, not floating reference, when edge is set', async ({
      page,
    }) => {
      const trigger = page.getByTestId('btn-edge-opener-trigger')
      const content = page.getByTestId('edge-opener-content')
      const sourceContainer = page.getByTestId('edge-trigger-source-container')

      // Assert Trigger is in source container
      const isTriggerInSource = await sourceContainer.evaluate((sc, trg) => sc.contains(trg), await trigger.elementHandle())
      expect(isTriggerInSource).toBe(true)

      // Open from Trigger
      await trigger.click()
      await expect(content).toBeVisible()

      // Trigger remains in source container
      const isTriggerStillInSource = await sourceContainer.evaluate((sc, trg) => sc.contains(trg), await trigger.elementHandle())
      expect(isTriggerStillInSource).toBe(true)

      // Content is bound to viewport bottom (data-edge="bottom", style.bottom="0px", position="fixed")
      await expect(content).toHaveAttribute('data-edge', 'bottom')
      const contentStyles = await content.evaluate(el => {
        const style = (el as HTMLElement).style
        return {
          position: style.position,
          bottom: style.bottom,
          left: style.left,
          right: style.right,
        }
      })
      expect(contentStyles.position).toBe('fixed')
      expect(contentStyles.bottom).toBe('0px')
      expect(contentStyles.left).toBe('0px')
      expect(contentStyles.right).toBe('0px')

      // Content rect spans viewport width at bottom
      const contentBox = (await content.boundingBox())!
      const viewport = page.viewportSize()!
      expect(Math.abs(contentBox.width - viewport.width)).toBeLessThanOrEqual(2)
      expect(Math.abs(contentBox.y + contentBox.height - viewport.height)).toBeLessThanOrEqual(2)

      await page.getByTestId('btn-close-edge-opener').click()
      await expect(content).toHaveCount(0)
    })
  })
})
