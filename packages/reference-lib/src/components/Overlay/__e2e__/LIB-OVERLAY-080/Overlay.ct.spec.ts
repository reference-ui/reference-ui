/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('11. Modal Pointer Isolation', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Dialog')
      await expect(page.getByTestId('dialog-fixture-root')).toBeVisible()
    })

    test('OV-POINTER-05: Retains modal pointer isolation through entire animated exit until unmount', async ({
      page,
    }) => {
      const bgBtn = page.getByTestId('btn-pres-pointer-exit-bg')
      const openBtn = page.getByTestId('btn-open-pres-pointer-exit')
      const content = page.getByTestId('dialog-pres-pointer-exit-content')
      const closeBtn = page.getByTestId('btn-close-pres-pointer-exit')

      await openBtn.click()
      await expect(content).toBeVisible()

      // Start animated close (250ms duration)
      await closeBtn.click()
      await expect(content).toHaveAttribute('data-state', 'closed')

      // At 80ms into the 250ms exit: Content is still mounted
      await page.waitForTimeout(80)
      await expect(content).toBeVisible()

      // Body pointer-events must STILL be locked to none
      const lockedDuringExit = await page.evaluate(() => document.body.style.pointerEvents)
      expect(lockedDuringExit).toBe('none')

      // Attempt clicking background button during exit
      const bgBox = await bgBtn.boundingBox()
      if (bgBox) {
        await page.mouse.click(bgBox.x + bgBox.width / 2, bgBox.y + bgBox.height / 2)
      }
      await expect(bgBtn).toHaveText('Pres Pointer Exit BG (0)')

      // Wait for exit completion and unmount
      await expect(content).toHaveCount(0, { timeout: 3000 })

      // Original pointer style restored
      const restored = await page.evaluate(() => document.body.style.pointerEvents)
      expect(restored).not.toBe('none')

      // Background button is clickable again
      await bgBtn.click()
      await expect(bgBtn).toHaveText('Pres Pointer Exit BG (1)')
    })
  })
})
