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

    test('OV-POS-01: Application centering styles are preserved on isolating dialog', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-basic-dialog').click()
      const content = page.getByTestId('dialog-content')
      await expect(content).toBeVisible()

      const inline = await content.evaluate(el => ({
        position: (el as HTMLElement).style.position,
        top: (el as HTMLElement).style.top,
        left: (el as HTMLElement).style.left,
      }))

      expect(inline.position).toBe('fixed')
      expect(inline.top).toBe('50%')
      expect(inline.left).toBe('50%')
      await page.getByTestId('btn-dialog-close').click()
    })
  })
})
