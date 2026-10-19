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

    test('OV-DOM-02: Unbound Content writes no inline position coordinates or centering', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-unbound').click()
      const content = page.getByTestId('dialog-unbound-content')
      await expect(content).toBeVisible()

      const inlineStyles = await content.evaluate(el => ({
        position: (el as HTMLElement).style.position,
        top: (el as HTMLElement).style.top,
        left: (el as HTMLElement).style.left,
        transform: (el as HTMLElement).style.transform,
      }))

      expect(inlineStyles.position).toBe('')
      expect(inlineStyles.top).toBe('')
      expect(inlineStyles.left).toBe('')
      expect(inlineStyles.transform).toBe('')
    })
  })
})
