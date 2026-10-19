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

    test('OV-POINTER-06: Cancels pointer teardown when reopening during exit', async ({
      page,
    }) => {
      const bgBtn = page.getByTestId('btn-reopen-pointer-bg')
      const openBtn = page.getByTestId('btn-open-reopen-pointer')
      const content = page.getByTestId('dialog-reopen-pointer-content')
      const quickCycleBtn = page.getByTestId('btn-reopen-pointer-quick-cycle')
      const finalCloseBtn = page.getByTestId('btn-close-reopen-pointer-final')

      await openBtn.click()
      await expect(content).toBeVisible()

      // Trigger close followed by reopen at 50ms (during 250ms exit)
      await quickCycleBtn.click()

      // At 80ms: reopening has occurred, content is open
      await page.waitForTimeout(80)
      await expect(content).toHaveAttribute('data-state', 'open')

      // Wait beyond the original 250ms exit window (e.g. 300ms total)
      // Stale exit event must NOT teardown pointer lock!
      await page.waitForTimeout(220)
      await expect(content).toBeVisible()

      const lockedAfterStaleExit = await page.evaluate(() => document.body.style.pointerEvents)
      expect(lockedAfterStaleExit).toBe('none')

      // Background button must not receive clicks
      const bgBox = await bgBtn.boundingBox()
      if (bgBox) {
        await page.mouse.click(bgBox.x + bgBox.width / 2, bgBox.y + bgBox.height / 2)
      }
      await expect(bgBtn).toHaveText('Reopen Pointer BG (0)')

      // Now perform clean final close
      await finalCloseBtn.click()
      await expect(content).toHaveCount(0, { timeout: 3000 })

      // Pointer lock finally restored
      const restored = await page.evaluate(() => document.body.style.pointerEvents)
      expect(restored).not.toBe('none')

      await bgBtn.click()
      await expect(bgBtn).toHaveText('Reopen Pointer BG (1)')
    })
  })
})
