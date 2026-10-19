/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('Anchored Floating UI & Arrow Contracts (OV-POS-*)', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Anchor')
      await expect(page.getByTestId('anchor-fixture-root')).toBeVisible()
    })

    test('OV-POS-05: Overlay.Arrow participates in position pass and honors edgePadding', async ({
      page,
    }) => {
      // 1. Default edgePadding = 4
      await page.getByTestId('anchor-target-arrow').click()
      const contentDefault = page.getByTestId('content-arrow-default')
      const arrowDefault = page.getByTestId('arrow-default')
      await expect(contentDefault).toBeVisible()
      await expect(arrowDefault).toBeVisible()

      const defaultContentBox = (await contentDefault.boundingBox())!
      const defaultArrowBox = (await arrowDefault.boundingBox())!

      expect(defaultArrowBox.x).toBeGreaterThanOrEqual(defaultContentBox.x + 3)
      await page.getByTestId('btn-close-arrow-default').click()
      await expect(contentDefault).toHaveCount(0)

      // 2. Custom edgePadding = 16
      await page.getByTestId('btn-open-arrow-custom').click()
      const contentCustom = page.getByTestId('content-arrow-custom')
      const arrowCustom = page.getByTestId('arrow-custom')
      await expect(contentCustom).toBeVisible()
      await expect(arrowCustom).toBeVisible()

      const customContentBox = (await contentCustom.boundingBox())!
      const customArrowBox = (await arrowCustom.boundingBox())!

      expect(customArrowBox.x).toBeGreaterThanOrEqual(customContentBox.x + 15)
      await page.getByTestId('btn-close-arrow-custom').click()
      await expect(contentCustom).toHaveCount(0)
    })
  })
})
