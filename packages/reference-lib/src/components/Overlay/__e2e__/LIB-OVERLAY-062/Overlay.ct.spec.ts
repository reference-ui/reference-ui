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

    test('OV-RESTORE-03: Restores focus to live candidate when opener is disabled or removed before exit completes', async ({
      page,
    }) => {
      // 1. Case: opener is disabled before exit completes
      await page.getByTestId('btn-reset-dead-opener-state').click()
      const opener = page.getByTestId('btn-dead-opener')
      const liveSibling = page.getByTestId('btn-live-sibling')

      await opener.click()
      const content = page.getByTestId('dead-opener-content')
      await expect(content).toBeVisible()

      // Disable opener and trigger close (with 150ms Presence exit)
      await page.getByTestId('btn-disable-opener-and-close').click()
      await expect(content).toHaveCount(0)

      // Opener is disabled, focus must move to nearest live candidate (liveSibling) without throwing
      await expect(opener).toBeDisabled()
      await expect(liveSibling).toBeFocused()

      // 2. Case: opener is removed before exit completes
      await page.getByTestId('btn-reset-dead-opener-state').click()
      await expect(opener).toBeEnabled()

      await opener.click()
      await expect(content).toBeVisible()

      // Remove opener and trigger close
      await page.getByTestId('btn-remove-opener-and-close').click()
      await expect(content).toHaveCount(0)

      // Opener is removed from DOM, focus must move to liveSibling
      await expect(opener).toHaveCount(0)
      await expect(liveSibling).toBeFocused()
    })
  })
})
