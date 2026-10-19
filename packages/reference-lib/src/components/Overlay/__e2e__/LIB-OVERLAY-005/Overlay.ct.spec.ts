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

    test('OV-DOM-04: Overlay honors Overlay.Portal container and never portals Trigger', async ({
      page,
    }) => {
      const trigger = page.getByTestId('btn-custom-portal-trigger')
      const customTarget = page.getByTestId('custom-portal-target')
      const backdrop = page.getByTestId('custom-portal-backdrop')
      const content = page.getByTestId('custom-portal-content')

      // Open from trigger
      await trigger.click()
      await expect(content).toBeVisible()
      await expect(backdrop).toBeVisible()

      // Assert Backdrop and Content are children of customTarget
      const isBackdropInside = await customTarget.evaluate((target, b) => target.contains(b), await backdrop.elementHandle())
      const isContentInside = await customTarget.evaluate((target, c) => target.contains(c), await content.elementHandle())
      expect(isBackdropInside).toBe(true)
      expect(isContentInside).toBe(true)

      // Assert Trigger stays in source DOM, NOT in customTarget
      const isTriggerInside = await customTarget.evaluate((target, t) => target.contains(t), await trigger.elementHandle())
      expect(isTriggerInside).toBe(false)

      // Assert no Overlay wrapper host inside customTarget (only portal content directly)
      const wrapperCount = await customTarget.evaluate(target => {
        return Array.from(target.children).filter(child =>
          child.tagName.toLowerCase() === 'reference-overlay' || child.hasAttribute('data-reference-overlay-host')
        ).length
      })
      expect(wrapperCount).toBe(0)

      await page.getByTestId('btn-close-custom-portal').click()
      await expect(content).toHaveCount(0)
    })
  })
})
