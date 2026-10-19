/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('3. Layer Stacks & Nesting Interactions', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Nested')
      await expect(page.getByTestId('nested-fixture-root')).toBeVisible()
    })

    test('OV-LAYER-06: Controlled parent close cascades deepest-first and restores only outer origin focus', async ({
      page,
    }) => {
      // Focus outer trigger and open parent
      const rootTrigger = page.getByTestId('btn-open-root-parent')
      await rootTrigger.focus()
      await page.keyboard.press('Enter')
      await expect(page.getByTestId('nested-parent-content')).toBeVisible()

      // Open child
      await page.getByTestId('btn-open-child').click()
      await expect(page.getByTestId('nested-child-content')).toBeVisible()

      // Open grandchild
      await page.getByTestId('btn-open-grandchild').click()
      await expect(page.getByTestId('nested-grandchild-content')).toBeVisible()

      // Close parent via controlled close button inside parent content
      await page.getByTestId('btn-parent-close-inner').click()

      // All overlays should unmount
      await expect(page.getByTestId('nested-grandchild-content')).toHaveCount(0)
      await expect(page.getByTestId('nested-child-content')).toHaveCount(0)
      await expect(page.getByTestId('nested-parent-content')).toHaveCount(0)

      // Descendants cascaded deepest-first: grandchild:dismiss before child:dismiss
      const log = (await page.getByTestId('nested-events-log').textContent()) || ''
      expect(log).toContain('grandchild:dismiss')
      expect(log).toContain('child:dismiss')
      expect(log.indexOf('grandchild:dismiss')).toBeLessThan(log.indexOf('child:dismiss'))

      // Outer origin trigger receives focus restoration
      await expect(rootTrigger).toBeFocused()
    })
  })
})
