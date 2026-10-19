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

    test('OV-HND-02: Dragging < 25% slowly snaps back without dismissing', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-edge-bottom').click()
      const content = page.getByTestId('edge-content')
      await expect(content).toBeVisible()

      const handle = page.getByTestId('edge-handle')
      const box = await handle.boundingBox()
      expect(box).toBeTruthy()

      // Slow drag down by only 20px over 25 steps (low velocity, < 25%)
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
      await page.mouse.down()
      await page.mouse.move(box!.x + box!.width / 2, box!.y + 20, { steps: 25 })
      // pause to ensure zero velocity
      await page.waitForTimeout(100)
      await page.mouse.up()

      // Content must STILL be visible and snapped back!
      await expect(content).toBeVisible()
      const transform = await content.evaluate(el => el.style.transform)
      expect(transform).toBe('')
    })
  })
})
