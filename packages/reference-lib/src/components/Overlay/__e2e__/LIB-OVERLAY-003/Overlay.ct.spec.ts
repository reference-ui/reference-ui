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

    test('OV-DOM-06: Pure controlled open prop changes without dismiss callbacks', async ({
      page,
    }) => {
      const content = page.getByTestId('dialog-controlled-content')
      await expect(content).toHaveCount(0)

      await page.getByTestId('btn-set-controlled-open').click()
      await expect(content).toBeVisible()
      await expect(page.getByTestId('controlled-escape-log')).toHaveText('')

      await page.getByTestId('btn-set-controlled-closed').click()
      await expect(content).toHaveCount(0)
      await expect(page.getByTestId('controlled-escape-log')).toHaveText('')
    })
  })
})
