/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('2. Escape Ordering & Cancellation', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Nested')
      await expect(page.getByTestId('nested-fixture-root')).toBeVisible()
    })

    test('OV-ESC-01 & OV-ESC-04: Escape key routes deepest-first and closes only the topmost layer', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-root-parent').click()
      const parent = page.getByTestId('nested-parent-content')
      await expect(parent).toBeVisible()

      await page.getByTestId('btn-open-child').click()
      const child = page.getByTestId('nested-child-content')
      await expect(child).toBeVisible()

      await page.getByTestId('btn-open-grandchild').click()
      const grandchild = page.getByTestId('nested-grandchild-content')
      await expect(grandchild).toBeVisible()

      // Press Escape 1: closes ONLY Grandchild
      await page.keyboard.press('Escape')
      await expect(grandchild).toHaveCount(0)
      await expect(child).toBeVisible()
      await expect(parent).toBeVisible()

      // Press Escape 2: closes ONLY Child
      await page.keyboard.press('Escape')
      await expect(child).toHaveCount(0)
      await expect(parent).toBeVisible()

      // Press Escape 3: closes Parent
      await page.keyboard.press('Escape')
      await expect(parent).toHaveCount(0)

      await expect(page.getByTestId('nested-events-log')).toHaveText(
        'open:parent,open:child,open:grandchild,grandchild:escape,grandchild:dismiss,child:escape,child:dismiss,parent:escape,parent:dismiss'
      )
    })
  })
})
