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
    test('OV-PRES-02: Waits for slower part (Backdrop 250ms, Content 100ms)', async ({ mount, page, }) => {
      await mount('components/Overlay/Overlay/Dialog')
      await page.getByTestId('btn-open-pres-backdrop-slower').click()
      const backdrop = page.getByTestId('dialog-pres-backdrop-slower-backdrop')
      const content = page.getByTestId('dialog-pres-backdrop-slower-content')
      await expect(backdrop).toBeVisible()
      await expect(content).toBeVisible()

      // Close dialog
      await page.getByTestId('btn-close-pres-backdrop-slower').click()

      // At 120ms (Content's 100ms exit is complete, but Backdrop's 250ms exit is still running)
      await page.waitForTimeout(120)

      // Content MUST NOT tear down early! Both parts must remain mounted in DOM
      await expect(backdrop).toBeVisible()
      await expect(content).toBeVisible()

      // Modal systems (pointer lock) must still be active
      const bodyPointer = await page.evaluate(() => document.body.style.pointerEvents)
      expect(bodyPointer).toBe('none')

      // After Backdrop 250ms completes (> 350ms total), both unmount together
      await expect(content).toHaveCount(0, { timeout: 3000 })
      await expect(backdrop).toHaveCount(0, { timeout: 3000 })

      // And modal pointer lock is restored
      const restoredPointer = await page.evaluate(() => document.body.style.pointerEvents)
      expect(restoredPointer).not.toBe('none')
    })
  })
})
