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

    test('OV-DOM-01 & OV-DOM-05: Renders no portal content initially, renders Backdrop and Content upon open', async ({
      page,
    }) => {
      const backdrop = page.getByTestId('dialog-backdrop')
      const content = page.getByTestId('dialog-content')

      await expect(backdrop).toHaveCount(0)
      await expect(content).toHaveCount(0)

      await page.getByTestId('btn-open-basic-dialog').click()

      await expect(backdrop).toBeVisible()
      await expect(content).toBeVisible()
      await expect(content.getByTestId('dialog-title')).toHaveText('Dialog Title')
      await page.waitForTimeout(200)
      await snap(page, 'dialog-basic-open')

      // Sibling elements in document.body
      const areSiblings = await page.evaluate(() => {
        const b = document.querySelector('[data-testid="dialog-backdrop"]')
        const c = document.querySelector('[data-testid="dialog-content"]')
        return b?.parentElement === document.body && c?.parentElement === document.body
      })
      expect(areSiblings).toBe(true)

      await page.getByTestId('btn-dialog-close').click()
      await expect(content).toHaveCount(0)
      await expect(backdrop).toHaveCount(0)
    })
  })
})
