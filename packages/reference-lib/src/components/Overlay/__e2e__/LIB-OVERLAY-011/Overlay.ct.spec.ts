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

    test('OV-DOM-08 & OV-DOM-09: Duplicate parts fail atomically and emit diagnostic warnings', async ({ mount, page, }) => {
      const consoleErrors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text())
      })

      // Duplicate backdrop
      await page.getByTestId('btn-open-dup-backdrop').click()
      await expect.poll(() => consoleErrors.some(e => e.includes('Duplicate Overlay.Backdrop'))).toBe(true)
      await expect(page.getByTestId('dup-backdrop-1')).toHaveCount(0)

      // Duplicate content
      await page.getByTestId('btn-open-dup-content').click()
      await expect.poll(() => consoleErrors.some(e => e.includes('Duplicate Overlay.Content'))).toBe(true)
      await expect(page.getByTestId('dup-content-1')).toHaveCount(0)

      // Duplicate trigger
      await page.getByTestId('btn-open-dup-trigger').click()
      await expect.poll(() => consoleErrors.some(e => e.includes('Duplicate Overlay.Trigger'))).toBe(true)

      // Duplicate handle
      await page.getByTestId('btn-open-dup-handle').click()
      await expect.poll(() => consoleErrors.some(e => e.includes('Duplicate Overlay.Handle'))).toBe(true)
      await expect(page.getByTestId('dup-handle-1')).toHaveCount(0)

      // Handle without edge
      await page.getByTestId('btn-open-no-edge-handle').click()
      await expect.poll(() => consoleErrors.some(e => e.includes('Overlay.Handle requires `edge`'))).toBe(true)

      // Missing content
      await page.getByTestId('btn-open-missing-content').click()
      await expect.poll(() => consoleErrors.some(e => e.includes('Missing Overlay.Content'))).toBe(true)
      await expect(page.getByTestId('missing-content-backdrop')).toHaveCount(0)

      // Mixed geometry (edge + anchor)
      await page.getByTestId('btn-open-mixed-geometry').click()
      await expect.poll(() => consoleErrors.some(e => e.includes('`edge` and `anchor` are mutually exclusive'))).toBe(true)
      await expect(page.getByTestId('mixed-geometry-content')).toHaveCount(0)
    })
  })
})
