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

    test('OV-OUT-06: Overlay should cancel stale outside dismissal when a deferred touch sequence returns inside or is canceled before click', async ({
      page,
    }) => {
      const openBtn = page.getByTestId('btn-open-touch')
      const content = page.getByTestId('touch-content')
      const backdrop = page.getByTestId('touch-backdrop')
      const log = page.getByTestId('touch-events-log')

      // 1. Touch Backdrop and verify no callback at pointerdown
      await openBtn.click()
      await expect(content).toBeVisible()
      await backdrop.dispatchEvent('pointerdown', { pointerId: 10, pointerType: 'touch', isPrimary: true, button: 0 })
      await expect(log).toHaveText('open')

      // Path A: Canceled before click
      await page.evaluate(() => document.dispatchEvent(new Event('pointercancel')))
      await backdrop.dispatchEvent('click', { bubbles: true })
      await expect(content).toBeVisible()
      await expect(log).toHaveText('open')

      // Path B: Touch down outside, but moves inside Content before click
      await backdrop.dispatchEvent('pointerdown', { pointerId: 11, pointerType: 'touch', isPrimary: true, button: 0 })
      await expect(log).toHaveText('open')
      const touchInsideBtn = page.getByTestId('btn-touch-inside')
      await touchInsideBtn.dispatchEvent('pointerdown', { pointerId: 11, pointerType: 'touch', isPrimary: true, button: 0 })
      await page.evaluate(() => document.dispatchEvent(new MouseEvent('click', { bubbles: true })))
      await expect(content).toBeVisible()

      // Path C: Uninterrupted touch outside completes matching click -> exactly one dismissal
      await backdrop.dispatchEvent('pointerdown', { pointerId: 12, pointerType: 'touch', isPrimary: true, button: 0 })
      await expect(log).not.toContainText('outside')
      await backdrop.dispatchEvent('click', { bubbles: true })
      await expect(content).toHaveCount(0)
      await expect(log).toContainText('outside')
      await expect(log).toContainText('dismiss')
    })
  })
})
