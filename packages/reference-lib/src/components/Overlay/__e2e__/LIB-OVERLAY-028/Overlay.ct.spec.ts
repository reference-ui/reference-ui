/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('4. Outside Press & Pointer Mechanics', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Outside')
      await expect(page.getByTestId('outside-fixture-root')).toBeVisible()
    })

    test('OV-OUT-09: ComposedPath classifies Shadow DOM inside Content as inside, outside as outside', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-outside-dialog').click()
      const content = page.getByTestId('outside-content')
      await expect(content).toBeVisible()

      // Click inside shadow host
      const insideShadowBtn = page.getByTestId('shadow-btn-inside')
      await insideShadowBtn.click()
      // Overlay must NOT close
      await expect(content).toBeVisible()

      // Click outside shadow host
      const outsideShadowBtn = page.getByTestId('shadow-btn-outside')
      await outsideShadowBtn.click({ force: true })
      // Overlay MUST close
      await expect(content).toHaveCount(0)
    })
  })
})
