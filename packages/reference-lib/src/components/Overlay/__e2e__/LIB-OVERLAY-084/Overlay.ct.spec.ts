/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('12. Trigger Interaction Suite (OV-TRG-03, OV-TRG-04, OV-TRG-05)', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Dialog')
      await expect(page.getByTestId('dialog-fixture-root')).toBeVisible()
    })

    test('OV-TRG-04: Trigger remains outside focus lock when isolation focus is on', async ({
      page,
    }) => {
      const openBtn = page.getByTestId('btn-open-trg-04')
      const content = page.getByTestId('trg-04-content')
      const inner1 = page.getByTestId('btn-trg-04-inner-1')
      const inner2 = page.getByTestId('btn-trg-04-inner-2')
      const closeBtn = page.getByTestId('btn-close-trg-04')

      await openBtn.click()
      await expect(content).toBeVisible()

      // Focus moves into Content
      await expect(inner1).toBeFocused()

      // Tab cycles inside Content
      await page.keyboard.press('Tab')
      await expect(inner2).toBeFocused()

      await page.keyboard.press('Tab')
      await expect(closeBtn).toBeFocused()

      // Tab from last wraps back to first, Trigger is NOT a trap stop
      await page.keyboard.press('Tab')
      await expect(inner1).toBeFocused()

      // Shift+Tab wraps back to last
      await page.keyboard.press('Shift+Tab')
      await expect(closeBtn).toBeFocused()

      // Focus was never on openBtn during cycling
      const activeId = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      expect(activeId).not.toBe('btn-open-trg-04')

      await closeBtn.click()
      await expect(content).toHaveCount(0)
    })
  })
})
