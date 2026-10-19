/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('OV-INERT-04 / OV-INERT-07: Dynamic inert and restore', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Inert')
      await expect(page.getByTestId('inert-fixture-root')).toBeVisible()
    })

    test('OV-INERT-07: Overlay restores background attributes once when animated exit completes and cancels that restoration when it reopens', async ({ mount, page, }) => {
      const authoredInert = page.getByTestId('inert-07-authored-inert')
      const authoredAria = page.getByTestId('inert-07-authored-aria')
      const ordinary = page.getByTestId('inert-07-ordinary')
      const content = page.getByTestId('inert-07-content')

      await expect(authoredInert).toHaveAttribute('inert')
      await expect(authoredAria).toHaveAttribute('aria-hidden', 'true')
      await expect(ordinary).not.toHaveAttribute('inert')

      await page.getByTestId('btn-open-inert-07').click()
      await expect(content).toBeVisible()
      await expect(ordinary).toHaveAttribute('inert')
      await expect(authoredInert).toHaveAttribute('inert')
      await expect(authoredAria).toHaveAttribute('aria-hidden', 'true')

      await page.getByTestId('btn-close-inert-07').click()
      await expect(content).toHaveCount(0, { timeout: 3000 })
      await expect(ordinary).not.toHaveAttribute('inert')
      await expect(ordinary).not.toHaveAttribute('data-overlay-managed-inert')
      await expect(authoredInert).toHaveAttribute('inert')
      await expect(authoredAria).toHaveAttribute('aria-hidden', 'true')

      await page.getByTestId('btn-open-inert-07').click()
      await expect(content).toBeVisible()
      await page.getByTestId('btn-inert-07-reopen').click()
      await page.waitForTimeout(80)
      await expect(content).toHaveAttribute('data-state', 'open')
      await page.evaluate(() => {
        const el = document.querySelector('[data-testid="inert-07-content"]')
        el?.dispatchEvent(
          new TransitionEvent('transitionend', { bubbles: true, propertyName: 'opacity' })
        )
        const backdrop = document.querySelector('[data-testid="inert-07-backdrop"]')
        backdrop?.dispatchEvent(
          new TransitionEvent('transitionend', { bubbles: true, propertyName: 'opacity' })
        )
      })
      await page.waitForTimeout(220)
      await expect(content).toBeVisible()
      await expect(ordinary).toHaveAttribute('inert')
      await expect(authoredInert).toHaveAttribute('inert')
      await expect(authoredAria).toHaveAttribute('aria-hidden', 'true')

      await page.getByTestId('btn-close-inert-07').click()
      await expect(content).toHaveCount(0, { timeout: 3000 })
      await expect(ordinary).not.toHaveAttribute('inert')
      await expect(authoredInert).toHaveAttribute('inert')
      await expect(authoredAria).toHaveAttribute('aria-hidden', 'true')
    })
  })
})
