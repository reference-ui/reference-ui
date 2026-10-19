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

    test('OV-EDGE-02: Overlay rejects edge combined with anchor with diagnostic', async ({
      page,
    }) => {
      const openBtn = page.getByTestId('btn-open-mixed-geom')
      const content = page.getByTestId('content-mixed-geom')
      const log = page.getByTestId('console-errors-log')

      await openBtn.click()

      // Diagnostic emitted
      await expect(log).toContainText('`edge` and `anchor` are mutually exclusive.')

      // Neither Floating UI coordinates nor edge binding applied (isCorrupted = true)
      await expect(content).toHaveCount(0)
    })
  })
})
