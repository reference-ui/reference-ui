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

    test('OV-RESTORE-04: Skips focus restoration entirely when restoreFocus={false}', async ({
      page,
    }) => {
      const trigger = page.getByTestId('btn-trigger-restore-false')
      const consumerTarget = page.getByTestId('btn-consumer-focus-target')

      await trigger.focus()
      await page.keyboard.press('Enter')
      const content = page.getByTestId('restore-false-content')
      await expect(content).toBeVisible()

      // Close the overlay through Presence
      await page.getByTestId('btn-close-and-move-focus').click()

      // Wait for complete unmount after Presence exit animation
      await expect(content).toHaveCount(0)

      // restoreFocus={false} skipped restoration: trigger is NOT focused
      await expect(trigger).not.toBeFocused()

      // Active element remains where consumer left it (or can be moved by consumer without being stolen)
      await consumerTarget.focus()
      await expect(consumerTarget).toBeFocused()
      await expect(trigger).not.toBeFocused()
    })
  })
})
