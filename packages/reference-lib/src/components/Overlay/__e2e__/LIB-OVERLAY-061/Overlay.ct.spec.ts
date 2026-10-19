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

    test('OV-FOCUS-07: Registers portalled child Content as FocusLock shard without parent reclaim', async ({
      page,
    }) => {
      const openParentBtn = page.getByTestId('btn-open-shard-parent')
      await openParentBtn.click()

      const parentContent = page.getByTestId('shard-parent-content')
      await expect(parentContent).toBeVisible()
      await expect(page.getByTestId('btn-shard-parent-1')).toBeFocused()

      // Open portalled child overlay (whose Content portals to document.body, outside parent Content in DOM)
      await page.getByTestId('btn-open-shard-child').click()
      const childContent = page.getByTestId('shard-child-content')
      await expect(childContent).toBeVisible()

      // Verify child content is NOT a descendant of parentContent in DOM (it portaled elsewhere)
      const isDescendantInDOM = await page.evaluate(() => {
        const parent = document.querySelector('[data-testid="shard-parent-content"]')
        const child = document.querySelector('[data-testid="shard-child-content"]')
        return Boolean(parent && child && parent.contains(child))
      })
      expect(isDescendantInDOM).toBe(false)

      // Focus enters child control (auto-focused or focused)
      const childBtn1 = page.getByTestId('btn-shard-child-1')
      const childBtn2 = page.getByTestId('btn-shard-child-2')
      await expect(childBtn1).toBeFocused()

      // Parent FocusLock wired child as shard: focus is NOT reclaimed to parent
      await page.keyboard.press('Tab')
      await expect(childBtn2).toBeFocused()

      // Close child overlay
      await page.getByTestId('btn-close-shard-child').click()
      await expect(childContent).toHaveCount(0)

      // Parent policy resumes: parent is active again, tabbing stays inside parent
      const isInsideParent = await parentContent.evaluate(el => el.contains(document.activeElement))
      expect(isInsideParent).toBe(true)

      await page.getByTestId('btn-close-shard-parent').click()
      await expect(parentContent).toHaveCount(0)
    })
  })
})
