/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('Focus & Restoration Contracts (OV-FOCUS-* & OV-RESTORE-*)', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Focus')
      await expect(page.getByTestId('focus-fixture-root')).toBeVisible()
    })

    test('OV-RESTORE-02: Restores focus to trigger immediately on zero-duration exit', async ({
      page,
    }) => {
      const trigger = page.getByTestId('btn-trigger-restore-zero')
      await trigger.focus()
      await page.keyboard.press('Enter')

      const content = page.getByTestId('restore-zero-content')
      await expect(content).toBeVisible()
      await expect(page.getByTestId('restore-zero-inner-btn')).toBeFocused()

      await page.getByTestId('btn-close-restore-zero').click()
      await expect(content).toHaveCount(0)
      await expect(trigger).toBeFocused()
    })
  })
})
