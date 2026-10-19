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

    test('OV-RESTORE-05: Cancels pending focus restoration when reopened during exit animation', async ({ mount, page, }) => {
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
      await page.waitForTimeout(220)
      await expect(content).toBeVisible()

      // Interrupted exit's restore target must NOT steal focus from active layer!
      const activeIdAfterStaleExit = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      expect(['btn-reopen-pointer-quick-cycle', 'btn-close-reopen-pointer-final']).toContain(activeIdAfterStaleExit)
      expect(activeIdAfterStaleExit).not.toBe('btn-open-reopen-pointer')

      // Final close
      await finalCloseBtn.click()
      await expect(content).toHaveCount(0, { timeout: 3000 })
    })
  })
})
