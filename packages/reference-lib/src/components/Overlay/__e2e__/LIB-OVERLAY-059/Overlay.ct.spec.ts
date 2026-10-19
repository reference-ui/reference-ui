/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('Focus & Restoration Contracts (OV-FOCUS-* & OV-RESTORE-*)', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Focus')
      await expect(page.getByTestId('focus-fixture-root')).toBeVisible()
    })

    test('OV-FOCUS-05: Preserves focus containment when focused element is removed, disabled, or hidden', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-dynamic-focus').click()
      const content = page.getByTestId('dynamic-focus-content')
      await expect(content).toBeVisible()

      const firstBtn = page.getByTestId('btn-dynamic-first')
      const middleBtn = page.getByTestId('btn-dynamic-middle')
      const removeBtn = page.getByTestId('btn-action-remove-middle')
      const disableBtn = page.getByTestId('btn-action-disable-middle')
      const hideBtn = page.getByTestId('btn-action-hide-middle')

      // 1. Remove focused element
      await middleBtn.focus()
      await expect(middleBtn).toBeFocused()

      // Click remove button via evaluate to remove middle button while maintaining focus context
      await removeBtn.evaluate((el: HTMLElement) => el.click())
      await expect(middleBtn).toHaveCount(0)

      // Press Tab: Focus must stay contained inside Content (should not leak to body or outside)
      await page.keyboard.press('Tab')
      const activeAfterRemove = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      expect(['btn-action-remove-middle', 'btn-dynamic-first', 'dynamic-focus-content', 'btn-dynamic-last']).toContain(activeAfterRemove)

      // Close and reopen to test disabling
      await page.getByTestId('btn-close-dynamic-focus').click()
      await expect(content).toHaveCount(0)

      // 2. Disable focused element
      await page.getByTestId('btn-open-dynamic-focus').click()
      await expect(content).toBeVisible()
      await middleBtn.focus()
      await expect(middleBtn).toBeFocused()

      await disableBtn.evaluate((el: HTMLElement) => el.click())
      await expect(middleBtn).toBeDisabled()

      await page.keyboard.press('Tab')
      const activeAfterDisable = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      expect(activeAfterDisable).not.toBe('btn-outside-focus-target')
      const isInsideAfterDisable = await page.evaluate(() => {
        const active = document.activeElement
        const container = document.querySelector('[data-testid="dynamic-focus-content"]')
        return container?.contains(active)
      })
      expect(isInsideAfterDisable).toBe(true)

      // Close and reopen to test hiding
      await page.getByTestId('btn-close-dynamic-focus').click()
      await expect(content).toHaveCount(0)

      // 3. Hide focused element
      await page.getByTestId('btn-open-dynamic-focus').click()
      await expect(content).toBeVisible()
      await middleBtn.focus()
      await expect(middleBtn).toBeFocused()

      await hideBtn.evaluate((el: HTMLElement) => el.click())
      await expect(middleBtn).toBeHidden()

      await page.keyboard.press('Tab')
      const isInsideAfterHide = await page.evaluate(() => {
        const active = document.activeElement
        const container = document.querySelector('[data-testid="dynamic-focus-content"]')
        return container?.contains(active)
      })
      expect(isInsideAfterHide).toBe(true)

      await page.getByTestId('btn-close-dynamic-focus').click()
      await expect(content).toHaveCount(0)
    })
  })
})
