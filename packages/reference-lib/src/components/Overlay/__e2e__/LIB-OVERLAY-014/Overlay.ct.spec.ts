/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('2. Escape Ordering & Cancellation', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Nested')
      await expect(page.getByTestId('nested-fixture-root')).toBeVisible()
    })

    test('OV-ESC-06: Non-dismissible AlertDialog when application prevents Escape', async ({ mount, page, }) => {
      await mount('components/Overlay/Overlay/Dialog')
      await page.getByTestId('btn-open-alertdialog').click()
      const content = page.getByTestId('alertdialog-content')
      await expect(content).toBeVisible()

      // Focus should be on the destructive button via data-autofocus
      const destructiveBtn = page.getByTestId('btn-alertdialog-destructive')
      await expect(destructiveBtn).toBeFocused()

      // Press Escape
      await page.keyboard.press('Escape')

      // Content should still be visible and open
      await expect(content).toBeVisible()

      // onEscape ran once, onDismiss did not run
      await expect(page.getByTestId('alertdialog-log')).toHaveText('alertdialog:escape')

      // Focus remains contained within the alertdialog
      await page.keyboard.press('Tab')
      await expect(page.getByTestId('btn-alertdialog-cancel')).toBeFocused()
    })
  })
})
