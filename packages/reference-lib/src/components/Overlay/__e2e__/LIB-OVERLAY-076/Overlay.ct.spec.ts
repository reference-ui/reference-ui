/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('10. Presence & Exit Lifecycle', () => {
    test('OV-PRES-05: Maintains one current lifecycle during rapid close -> reopen -> close sequence', async ({ mount, page, }) => {
      await mount('components/Overlay/Overlay/Dialog')
      const openBtn = page.getByTestId('btn-open-pres-equal')
      const backdrop = page.getByTestId('dialog-pres-equal-backdrop')
      const content = page.getByTestId('dialog-pres-equal-content')

      // 1. Initial open
      await openBtn.click()
      await expect(content).toBeVisible()
      await expect(content).toHaveAttribute('data-state', 'open')

      // 2. Trigger rapid close -> reopen cycle during exit animation
      await page.getByTestId('btn-close-then-reopen-inner').click()

      // At 60ms (reopened at 40ms, so it is open again while the 150ms animation was in-flight)
      await page.waitForTimeout(60)

      // Content and Backdrop should return to open state and NOT unmount
      await expect(content).toHaveAttribute('data-state', 'open')
      await expect(backdrop).toHaveAttribute('data-state', 'open')
      await expect(content).toBeVisible()
      await expect(backdrop).toBeVisible()

      // Wait beyond the original 150ms to ensure stale exit animation does NOT unmount it
      await page.waitForTimeout(160)
      await expect(content).toBeVisible()
      await expect(backdrop).toBeVisible()

      // Pointer lock should still be active
      const locked = await page.evaluate(() => document.body.style.pointerEvents)
      expect(locked).toBe('none')

      // 3. Final close
      await page.getByTestId('btn-close-pres-equal').click()
      await expect(content).toHaveAttribute('data-state', 'closed')

      // Should unmount cleanly after final exit
      await expect(content).toHaveCount(0, { timeout: 3000 })
      await expect(backdrop).toHaveCount(0, { timeout: 3000 })

      // Pointer lock restored exactly once
      const restored = await page.evaluate(() => document.body.style.pointerEvents)
      expect(restored).not.toBe('none')
    })
  })
})
