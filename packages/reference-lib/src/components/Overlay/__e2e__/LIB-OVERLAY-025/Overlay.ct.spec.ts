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

    test('OV-OUT-03: Preventing outside press keeps overlay open', async ({
      page,
    }) => {
      await page.getByTestId('chk-prevent-outside').check()
      await page.getByTestId('btn-open-outside-dialog').click()
      const backdrop = page.getByTestId('outside-backdrop')

      await backdrop.click({ position: { x: 10, y: 10 } })
      await expect(page.getByTestId('outside-content')).toBeVisible()
      await expect(page.getByTestId('outside-events-log')).toContainText('outside:button=0')
    })
  })
})
