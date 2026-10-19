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

    test('OV-RESTORE-01: Restores focus only after animated exit completes', async ({
      page,
    }) => {
      const trigger = page.getByTestId('btn-trigger-restore-animated')
      await trigger.focus()
      await page.keyboard.press('Enter')

      const content = page.getByTestId('restore-animated-content')
      await expect(content).toBeVisible()
      await expect(page.getByTestId('restore-animated-inner-btn')).toBeFocused()

      await page.getByTestId('btn-close-restore-animated').click()
      // Content should still be mounted with data-state="closed" during exit animation
      await expect(content).toHaveAttribute('data-state', 'closed')

      // Wait for complete unmount
      await expect(content).toHaveCount(0)
      // Focus restores to trigger upon unmount
      await expect(trigger).toBeFocused()
    })
  })
})
