/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('11. Modal Pointer Isolation', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Dialog')
      await expect(page.getByTestId('dialog-fixture-root')).toBeVisible()
    })

    test('OV-POINTER-01: Blocks background pointer activation (mouse, text, focus) while modal is open', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 1000 })
      const bgBtn = page.getByTestId('btn-pointer-bg-click')
      const bgInput = page.getByTestId('input-pointer-bg-text')
      const openBtn = page.getByTestId('btn-open-pointer-iso')
      const content = page.getByTestId('pointer-iso-content')
      const insideBtn = page.getByTestId('btn-pointer-inside-action')

      // Initial sanity: background controls work before modal opens
      await bgBtn.click()
      await expect(bgBtn).toHaveText('BG Click (1)')

      // Open modal
      await openBtn.click()
      await expect(content).toBeVisible()

      // While open, clicking inside content works normally
      await insideBtn.click()
      await expect(insideBtn).toHaveText('Inside Action (1)')

      // Click at background button coordinates while modal is open:
      // Real click lands on backdrop, closing the modal without activating the background button
      const bgBox = await bgBtn.boundingBox()
      expect(bgBox).not.toBeNull()
      if (bgBox) {
        await page.mouse.click(bgBox.x + bgBox.width / 2, bgBox.y + bgBox.height / 2)
      }
      await expect(content).toHaveCount(0)
      // Background button counter must remain unchanged!
      await expect(bgBtn).toHaveText('BG Click (1)')

      // Re-open modal to test input focus isolation
      await openBtn.click()
      await expect(content).toBeVisible()

      // Real mouse click at background input coordinates while modal is open:
      const inputBox = await bgInput.boundingBox()
      expect(inputBox).not.toBeNull()
      if (inputBox) {
        await page.mouse.click(inputBox.x + inputBox.width / 2, inputBox.y + inputBox.height / 2)
      }
      await expect(content).toHaveCount(0)
      // Background input must NOT have received focus
      const isInputActive = await bgInput.evaluate(el => el === document.activeElement)
      expect(isInputActive).toBe(false)

      // Once fully closed, background controls work normally
      await bgBtn.click()
      await expect(bgBtn).toHaveText('BG Click (2)')
      await bgInput.click()
      await bgInput.fill('hello')
      await expect(bgInput).toHaveValue('hello')
    })
  })
})
