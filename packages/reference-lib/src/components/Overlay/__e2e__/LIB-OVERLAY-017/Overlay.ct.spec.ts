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

    test('OV-LAYER-03: Single outside click beyond all layers is consumed by child first, leaving parent open', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-root-parent').click()
      await page.getByTestId('btn-open-child').click()
      await expect(page.getByTestId('nested-child-content')).toBeVisible()

      // Click outside target (force: true because modal dialog backdrop marks outside document inert)
      await page.getByTestId('btn-nested-outside-target').click({ force: true })
      // Child should be dismissed
      await expect(page.getByTestId('nested-child-content')).toHaveCount(0)
      // Parent should remain open!
      await expect(page.getByTestId('nested-parent-content')).toBeVisible()
    })
  })
})
