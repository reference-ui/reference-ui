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

    test('OV-FOCUS-01: Focuses first tabbable by default, or autoFocus when present', async ({
      page,
    }) => {
      // 1. Default first tabbable
      const trigger = page.getByTestId('btn-trigger-focus-default')
      await trigger.click()
      const content = page.getByTestId('focus-default-content')
      await expect(content).toBeVisible()
      await expect(page.getByTestId('focus-default-btn-1')).toBeFocused()

      await page.getByTestId('btn-close-focus-default').click()
      await expect(content).toHaveCount(0)

      // 2. Authored autoFocus takes priority
      const triggerAutoFocus = page.getByTestId('btn-trigger-focus-autofocus')
      await triggerAutoFocus.click()
      const autoFocusContent = page.getByTestId('focus-autofocus-content')
      await expect(autoFocusContent).toBeVisible()
      await expect(page.getByTestId('focus-autofocus-btn-2')).toBeFocused()

      await page.getByTestId('btn-close-focus-autofocus').click()
      await expect(autoFocusContent).toHaveCount(0)
    })
  })
})
