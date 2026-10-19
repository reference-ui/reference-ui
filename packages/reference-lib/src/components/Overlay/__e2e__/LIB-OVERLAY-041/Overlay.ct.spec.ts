/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('6. Inert Background Isolation', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Inert')
      await expect(page.getByTestId('inert-fixture-root')).toBeVisible()
    })

    test('OV-INERT-05: Live regions and toast host are exempted from inerting', async ({ mount, page, }) => {
      await page.getByTestId('btn-open-inert-dialog').click()
      await expect(page.getByTestId('inert-content')).toBeVisible()

      const liveRegionInert = await page.getByTestId('sibling-live-region').evaluate(
        el => el.hasAttribute('inert')
      )
      expect(liveRegionInert).toBe(false)

      const toastHostInert = await page.getByTestId('sibling-toast-host').evaluate(
        el => el.hasAttribute('inert')
      )
      expect(toastHostInert).toBe(false)
    })
  })
})
