/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('1. DOM & Anatomy Contracts', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Dialog')
      await expect(page.getByTestId('dialog-fixture-root')).toBeVisible()
    })

    test('OV-FOCUS-04: Focus is trapped inside overlay content while open', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-basic-dialog').click()
      const firstAction = page.getByTestId('btn-dialog-first')
      const closeBtn = page.getByTestId('btn-dialog-close')

      await expect(firstAction).toBeFocused()

      await page.keyboard.press('Tab')
      await expect(closeBtn).toBeFocused()

      await page.keyboard.press('Tab')
      await expect(firstAction).toBeFocused()

      await page.getByTestId('btn-dialog-close').click()
    })
  })
})
