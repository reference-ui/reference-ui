/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('7. Edge Sheets & Handle Gestures', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Edge')
      await expect(page.getByTestId('edge-fixture-root')).toBeVisible()
    })

    test('OV-EDGE-04: Overlay publishes nested edge stack CSS variables (--reference-overlay-index, --reference-overlay-count)', async ({ mount, page, }) => {
      // 1. Open primary edge sheet
      await page.getByTestId('btn-open-edge-bottom').click()
      const parentContent = page.getByTestId('edge-content')
      await expect(parentContent).toBeVisible()

      // When only parent is open: count=1, index=0
      let parentVars = await parentContent.evaluate(el => ({
        index: (el as HTMLElement).style.getPropertyValue('--reference-overlay-index'),
        count: (el as HTMLElement).style.getPropertyValue('--reference-overlay-count'),
      }))
      expect(parentVars.index).toBe('0')
      expect(parentVars.count).toBe('1')

      // 2. Open nested edge sheet
      await page.getByTestId('btn-open-nested-sheet').click()
      const nestedContent = page.getByTestId('nested-edge-content')
      await expect(nestedContent).toBeVisible()

      // Topmost (child) has index=0, count=2
      const childVars = await nestedContent.evaluate(el => ({
        index: (el as HTMLElement).style.getPropertyValue('--reference-overlay-index'),
        count: (el as HTMLElement).style.getPropertyValue('--reference-overlay-count'),
      }))
      expect(childVars.index).toBe('0')
      expect(childVars.count).toBe('2')

      // Parent now has index=1, count=2 (distinguishing topmost from parent for displacement)
      parentVars = await parentContent.evaluate(el => ({
        index: (el as HTMLElement).style.getPropertyValue('--reference-overlay-index'),
        count: (el as HTMLElement).style.getPropertyValue('--reference-overlay-count'),
      }))
      expect(parentVars.index).toBe('1')
      expect(parentVars.count).toBe('2')

      // 3. Close nested sheet
      await page.getByTestId('btn-close-nested-sheet').click()
      await expect(nestedContent).toHaveCount(0)

      // Parent restores to index=0, count=1
      parentVars = await parentContent.evaluate(el => ({
        index: (el as HTMLElement).style.getPropertyValue('--reference-overlay-index'),
        count: (el as HTMLElement).style.getPropertyValue('--reference-overlay-count'),
      }))
      expect(parentVars.index).toBe('0')
      expect(parentVars.count).toBe('1')

      await page.getByTestId('btn-close-edge').click()
      await expect(parentContent).toHaveCount(0)
    })
  })
})
