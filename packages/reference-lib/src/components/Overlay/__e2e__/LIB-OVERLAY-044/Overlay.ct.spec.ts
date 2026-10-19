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

    test('OV-HND-01: Dragging bottom handle past 25% requests dismiss', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-edge-bottom').click()
      const content = page.getByTestId('edge-content')
      await expect(content).toBeVisible()

      const handle = page.getByTestId('edge-handle')
      const box = await handle.boundingBox()
      expect(box).toBeTruthy()

      // Drag down past 25% (e.g. 150px on 240px sheet)
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
      await page.mouse.down()
      await page.mouse.move(box!.x + box!.width / 2, box!.y + 150, { steps: 10 })
      await page.mouse.up()

      await expect(content).toHaveCount(0)
    })
  })
})
