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
    test('OV-PRES-03: Ignores bubbled child animation events when Content itself is still exiting', async ({ mount, page, }) => {
      await mount('components/Overlay/Overlay/Dialog')
      await page.getByTestId('btn-open-pres-child-anim').click()
      const backdrop = page.getByTestId('dialog-pres-child-anim-backdrop')
      const content = page.getByTestId('dialog-pres-child-anim-content')
      const child = page.getByTestId('pres-child-anim-target')
      await expect(backdrop).toBeVisible()
      await expect(content).toBeVisible()
      await expect(child).toBeVisible()

      // Close dialog
      await page.getByTestId('btn-close-pres-child-anim').click()

      // At 80ms (child's 50ms animation is done and bubbled, but Content/Backdrop 250ms is still active)
      await page.waitForTimeout(80)

      // Content and Backdrop MUST remain mounted despite child's animationend event bubbling
      await expect(backdrop).toBeVisible()
      await expect(content).toBeVisible()

      // After 250ms owned animations complete (> 350ms total), both unmount
      await expect(content).toHaveCount(0, { timeout: 3000 })
      await expect(backdrop).toHaveCount(0, { timeout: 3000 })
    })
  })
})
