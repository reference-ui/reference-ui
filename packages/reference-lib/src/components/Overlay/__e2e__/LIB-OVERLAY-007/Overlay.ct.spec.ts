/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('1. DOM & Anatomy Contracts', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Dialog')
      await expect(page.getByTestId('dialog-fixture-root')).toBeVisible()
    })

    test('OV-INERT-02: Overlay preserves pre-existing isolation attributes when it closes', async ({
      page,
    }) => {
      const preInert = page.getByTestId('pre-existing-inert')
      const preAria = page.getByTestId('pre-existing-aria-hidden')
      const ordinary = page.getByTestId('ordinary-sibling-node')
      const openBtn = page.getByTestId('btn-open-inert-preserve')
      const content = page.getByTestId('content-inert-preserve')
      const closeBtn = page.getByTestId('btn-close-inert-preserve')

      // Initial state before opening:
      await expect(preInert).toHaveAttribute('inert')
      await expect(preAria).toHaveAttribute('aria-hidden', 'true')
      await expect(ordinary).not.toHaveAttribute('inert')

      // Open Overlay
      await openBtn.click()
      await expect(content).toBeVisible()

      // While open: ordinary node becomes inert, pre-existing attributes stay intact
      await expect(ordinary).toHaveAttribute('inert')
      await expect(preInert).toHaveAttribute('inert')
      await expect(preAria).toHaveAttribute('aria-hidden', 'true')

      // Close Overlay
      await closeBtn.click()
      await expect(content).toHaveCount(0)

      // After close: ordinary node has inert removed, pre-existing inert and aria-hidden remain intact
      await expect(ordinary).not.toHaveAttribute('inert')
      await expect(preInert).toHaveAttribute('inert')
      await expect(preAria).toHaveAttribute('aria-hidden', 'true')
    })
  })
})
