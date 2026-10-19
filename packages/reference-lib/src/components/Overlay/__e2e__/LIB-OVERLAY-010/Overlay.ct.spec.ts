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

    test('OV-ISO-02: isolation={false} does not inert the background', async ({
      page,
    }) => {
      const counter = page.getByTestId('btn-outside-counter')
      await page.getByTestId('btn-set-controlled-open').click()
      const content = page.getByTestId('dialog-controlled-content')
      await expect(content).toBeVisible()

      const inert = await counter.evaluate(el => Boolean(el.closest('[inert]')))
      expect(inert).toBe(false)
      await counter.click()
      await expect(counter).toHaveText('Outside Counter (1)')

      await page.getByTestId('btn-set-controlled-closed').click()
      await expect(content).toHaveCount(0)
    })
  })
})
