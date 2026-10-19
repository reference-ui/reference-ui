/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('4. Outside Press & Pointer Mechanics', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Outside')
      await expect(page.getByTestId('outside-fixture-root')).toBeVisible()
    })

    test('OV-POINTER-02: Restores exact consumer pointer styles on body after modal close', async ({
      page,
    }) => {
      await page.evaluate(() => {
        document.body.style.setProperty('pointer-events', 'auto', 'important')
      })
      const before = await page.evaluate(() => ({
        val: document.body.style.getPropertyValue('pointer-events'),
        prio: document.body.style.getPropertyPriority('pointer-events'),
      }))
      expect(before.val).toBe('auto')
      expect(before.prio).toBe('important')

      await page.getByTestId('btn-open-outside-dialog').click()
      await expect(page.getByTestId('outside-content')).toBeVisible()

      // Body should be locked to none
      const locked = await page.evaluate(() => document.body.style.pointerEvents)
      expect(locked).toBe('none')

      // Close dialog via backdrop click
      await page.getByTestId('outside-backdrop').click({ position: { x: 10, y: 10 } })
      await expect(page.getByTestId('outside-content')).toHaveCount(0)

      // Exact value and priority restored
      const restored = await page.evaluate(() => ({
        val: document.body.style.getPropertyValue('pointer-events'),
        prio: document.body.style.getPropertyPriority('pointer-events'),
      }))
      expect(restored.val).toBe('auto')
      expect(restored.prio).toBe('important')

      // Cleanup
      await page.evaluate(() => document.body.style.removeProperty('pointer-events'))
    })
  })
})
