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

    test('OV-INERT-01: Sibling DOM nodes are marked inert while isolating overlay is open', async ({
      page,
    }) => {
      const siblingContainer = page.getByTestId('inert-sibling-container')
      const siblingBtn = page.getByTestId('btn-sibling-clickable')

      await page.getByTestId('btn-open-inert-dialog').click()
      await expect(page.getByTestId('inert-content')).toBeVisible()

      const isInert = await siblingContainer.evaluate(el => el.hasAttribute('inert') || Boolean(el.closest('[inert]')))
      expect(isInert).toBe(true)

      // Clicking sibling button has no effect
      await siblingBtn.click({ force: true })
      await expect(siblingBtn).toHaveText('Sibling Button (Clicks: 0)')

      await page.getByTestId('btn-close-inert-dialog').click()
      await expect(page.getByTestId('inert-content')).toHaveCount(0)

      const isStillInert = await siblingContainer.evaluate(el => el.hasAttribute('inert') || Boolean(el.closest('[inert]')))
      expect(isStillInert).toBe(false)
    })
  })
})
