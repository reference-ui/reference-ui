/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('1. DOM & Anatomy Contracts', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Dialog')
      await expect(page.getByTestId('dialog-fixture-root')).toBeVisible()
    })

    test('OV-DOM-07: Overlay remains fully active when dismissal is rejected by parent', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-reject').click()
      const content = page.getByTestId('dialog-reject-content')
      const backdrop = page.getByTestId('dialog-reject-backdrop')
      await expect(content).toBeVisible()

      // Press Escape
      await page.getByTestId('btn-reject-inner').focus()
      await page.keyboard.press('Escape')
      await expect(page.getByTestId('reject-log')).toContainText('escape-called')

      // Overlay must STILL be open and visible!
      await expect(content).toBeVisible()
      await expect(backdrop).toBeVisible()

      // Click outside on backdrop
      await backdrop.click({ position: { x: 10, y: 10 } })
      await expect(page.getByTestId('reject-log')).toContainText('outside-called')
      await expect(content).toBeVisible()

      // Force close via application state
      await page.getByTestId('btn-reject-force-close').click()
      await expect(content).toHaveCount(0)
    })
  })
})
