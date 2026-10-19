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

    test('OV-FOCUS-03: Skips initial focus move when initialFocus={false}, reclaims once inside', async ({
      page,
    }) => {
      const trigger = page.getByTestId('btn-trigger-no-initial')
      await trigger.focus()
      await expect(trigger).toBeFocused()
      await page.keyboard.press('Enter')

      const content = page.getByTestId('focus-no-initial-content')
      await expect(content).toBeVisible()
      // Focus must remain on the trigger (initial focus skipped)
      await expect(trigger).toBeFocused()

      // Entering content activates trap
      await page.getByTestId('focus-no-initial-btn-1').click()
      // WebKit clicks never focus buttons —
      // deliver the Chromium focus state so the trap engages; the reclaim
      // contract below runs identically.
      if (isWebKit(page)) await page.getByTestId('focus-no-initial-btn-1').focus()
      await expect(page.getByTestId('focus-no-initial-btn-1')).toBeFocused()

      // Attempting programmatic escape outside must be reclaimed
      await page.evaluate(() => {
        document.querySelector<HTMLElement>('[data-testid="btn-outside-focus-target"]')?.focus()
      })
      await expect(page.getByTestId('focus-no-initial-btn-1')).toBeFocused()

      await page.getByTestId('btn-close-no-initial').click()
      await expect(content).toHaveCount(0)
    })
  })
})
