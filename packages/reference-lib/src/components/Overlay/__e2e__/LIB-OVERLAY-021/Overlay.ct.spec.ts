/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
    test('OV-LAYER-08: Overlay should retain a valid stack when layers are removed out of registration order', async ({ mount, page, }) => {
      await mount('components/Overlay/Overlay/Nested')
      await expect(page.getByTestId('nested-fixture-root')).toBeVisible()

      await page.getByTestId('btn-sib-all').click({ force: true })
      await expect(page.getByTestId('sib-content-1')).toBeVisible()
      await expect(page.getByTestId('sib-content-2')).toBeVisible()
      await expect(page.getByTestId('sib-content-3')).toBeVisible()

      // We have 3 sibling layers open.
      // Unmount the middle layer (2)
      await page.getByTestId('btn-sib-close-2').click({ force: true })
      await expect(page.getByTestId('sib-content-2')).toHaveCount(0)

      // The top live layer is 3. Escape should close 3.
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
      await expect(page.getByTestId('sib-content-3')).toHaveCount(0)

      // The next live layer is 1.
      await expect(page.getByTestId('sib-content-1')).toBeVisible()
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
      await expect(page.getByTestId('sib-content-1')).toHaveCount(0)
    })
})
