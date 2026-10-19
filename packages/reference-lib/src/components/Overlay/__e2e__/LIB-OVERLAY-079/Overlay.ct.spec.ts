/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('11. Modal Pointer Isolation', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Dialog')
      await expect(page.getByTestId('dialog-fixture-root')).toBeVisible()
    })

    test('OV-POINTER-04: Makes only top modal Content interactive when layers overlap', async ({
      page,
    }) => {
      const openLower = page.getByTestId('btn-open-overlap-lower')
      const lowerContent = page.getByTestId('overlap-lower-content')
      const topContent = page.getByTestId('overlap-top-content')
      const lowerActionBtn = page.getByTestId('btn-overlap-lower-action')
      const topActionBtn = page.getByTestId('btn-overlap-top-action')

      // Open lower modal first
      await openLower.click()
      await expect(lowerContent).toBeVisible()
      // Lower modal button works when it is the topmost modal
      await lowerActionBtn.click()
      await expect(lowerActionBtn).toHaveText('Lower Action (1)')

      // Open top modal from inside lower modal
      await page.getByTestId('btn-open-overlap-top-from-lower').click()
      await expect(topContent).toBeVisible()

      // Click top modal button -> responds normally
      await topActionBtn.click()
      await expect(topActionBtn).toHaveText('Top Action (1)')

      // Attempt to click exposed lower modal button (it has pointer-events: none)
      await lowerActionBtn.click({ force: true })

      // Lower action MUST NOT increment (it is not interactive while top modal is open)
      await expect(lowerActionBtn).toHaveText('Lower Action (1)')
      // Lower action button MUST NOT receive focus
      const isLowerFocused = await lowerActionBtn.evaluate(el => el === document.activeElement)
      expect(isLowerFocused).toBe(false)

      // Lower content must NOT dismiss both
      await expect(lowerContent).toBeVisible()

      // Close top modal
      await page.getByTestId('btn-close-overlap-top').click()
      await expect(topContent).toHaveCount(0)

      // Lower modal is now topmost again and interactive
      await lowerActionBtn.click()
      await expect(lowerActionBtn).toHaveText('Lower Action (2)')
    })
  })
})
