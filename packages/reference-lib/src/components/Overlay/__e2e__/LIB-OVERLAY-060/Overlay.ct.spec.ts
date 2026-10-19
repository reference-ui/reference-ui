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

    test('OV-FOCUS-06: Pauses parent focus lock when nested modal is active and resumes upon close', async ({
      page,
    }) => {
      const openParentBtn = page.getByTestId('btn-open-parent-modal')
      await openParentBtn.click()

      const parentContent = page.getByTestId('parent-modal-content')
      await expect(parentContent).toBeVisible()
      const parentBtn1 = page.getByTestId('btn-parent-focus-1')
      await expect(parentBtn1).toBeFocused()

      // Open child modal
      await page.getByTestId('btn-open-child-modal').click()
      const childContent = page.getByTestId('child-modal-content')
      await expect(childContent).toBeVisible()

      const childBtn1 = page.getByTestId('btn-child-focus-1')
      const childBtn2 = page.getByTestId('btn-child-focus-2')
      await expect(childBtn1).toBeFocused()

      // Tabbing loops within child modal only
      await page.keyboard.press('Tab')
      await expect(childBtn2).toBeFocused()

      // Attempt programmatic escape to parent modal control: child lock must reclaim!
      await parentBtn1.evaluate((el: HTMLElement) => el.focus())
      // Parent must NOT retain focus; child lock reclaims focus to child candidate
      const activeDuringChild = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      expect(['btn-child-focus-1', 'btn-child-focus-2', 'child-modal-content']).toContain(activeDuringChild)

      // Attempt programmatic escape to background: child lock must reclaim!
      await page.evaluate(() => {
        document.querySelector<HTMLElement>('[data-testid="btn-outside-focus-target"]')?.focus()
      })
      const activeDuringBgAttempt = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
      expect(['btn-child-focus-1', 'btn-child-focus-2', 'child-modal-content']).toContain(activeDuringBgAttempt)

      // Close child modal
      await page.getByTestId('btn-close-child-modal').click()
      await expect(childContent).toHaveCount(0)

      // Parent modal resumes! Focus returns to parent control
      const isInsideParent = await page.evaluate(() => {
        const active = document.activeElement
        const parent = document.querySelector('[data-testid="parent-modal-content"]')
        return parent?.contains(active)
      })
      expect(isInsideParent).toBe(true)

      // Parent lock now contains focus: attempting programmatic escape outside is reclaimed by parent
      await page.evaluate(() => {
        document.querySelector<HTMLElement>('[data-testid="btn-outside-focus-target"]')?.focus()
      })
      const isInsideParentAfterReclaim = await page.evaluate(() => {
        const active = document.activeElement
        const parent = document.querySelector('[data-testid="parent-modal-content"]')
        return parent?.contains(active)
      })
      expect(isInsideParentAfterReclaim).toBe(true)

      // Close parent modal
      await page.getByTestId('btn-close-parent-modal').click()
      await expect(parentContent).toHaveCount(0)
    })
  })
})
