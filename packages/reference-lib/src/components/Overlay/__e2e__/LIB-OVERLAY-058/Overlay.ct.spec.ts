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

    test('OV-RESTORE-07: Restores focus to explicit FocusTarget upon close', async ({
      page,
    }) => {
      const trigger = page.getByTestId('btn-trigger-custom-restore')
      const target = page.getByTestId('btn-custom-restore-target')

      await trigger.click()
      const content = page.getByTestId('custom-restore-content')
      await expect(content).toBeVisible()

      await page.getByTestId('btn-close-custom-restore').click()
      await expect(content).toHaveCount(0)
      await expect(target).toBeFocused()
    })
  })
})
