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

    test('OV-ESC-03: Observes latest state closure and prevents escape dismissal after rerender', async ({ mount, page, }) => {
      await mount('components/Overlay/Overlay/Dialog')
      await page.getByTestId('btn-open-escape-rerender').click()
      const content = page.getByTestId('escape-rerender-content')
      await expect(content).toBeVisible()

      // Increment count to 1 (triggering state update and rerender)
      await page.getByTestId('btn-increment-escape-block').click()
      await expect(page.getByTestId('escape-block-count')).toHaveText('Count: 1')

      // Press Escape: the updated closure should observe escapeBlockCount=1 and call preventDefault()
      await page.keyboard.press('Escape')

      // Content should remain open and modal
      await expect(content).toBeVisible()

      // onDismiss should NOT have been called
      await expect(page.getByTestId('escape-rerender-log')).toHaveText('escape:count=1')
    })
  })
})
