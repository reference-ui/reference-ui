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

    test('OV-LAYER-04: Outside touch tap dismisses child without dismissing deferred modal parent', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-root-parent').click()
      await page.getByTestId('btn-open-child').click()
      await expect(page.getByTestId('nested-child-content')).toBeVisible()
      await expect(page.getByTestId('nested-parent-content')).toBeVisible()

      // Dispatch touch tap sequence on outside target
      const target = page.getByTestId('btn-nested-outside-target')
      await target.dispatchEvent('pointerdown', { pointerType: 'touch', button: 0, isPrimary: true })
      await target.dispatchEvent('touchstart')
      await target.dispatchEvent('touchend')
      await target.dispatchEvent('pointerup', { pointerType: 'touch', button: 0, isPrimary: true })
      await target.dispatchEvent('click')

      // Child should be dismissed
      await expect(page.getByTestId('nested-child-content')).toHaveCount(0)

      // Modal parent MUST remain open!
      await expect(page.getByTestId('nested-parent-content')).toBeVisible()

      // Log must show child outside and dismiss, but NO parent dismissal
      const log = await page.getByTestId('nested-events-log').textContent()
      expect(log).toContain('child:outside')
      expect(log).toContain('child:dismiss')
      expect(log).not.toContain('parent:outside')
      expect(log).not.toContain('parent:dismiss')
    })
  })
})
