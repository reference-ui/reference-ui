/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('8. Themed Portal Scoping', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Theme')
      await expect(page.getByTestId('theme-fixture-root')).toBeVisible()
    })

    test('OV-TRG-02: isolation={false} Trigger is the Floating UI reference', async ({
      page,
    }) => {
      const trigger = page.getByTestId('btn-open-dark-theme')
      const content = page.getByTestId('content-dark-theme')

      await expect(content).toHaveCount(0)
      await trigger.click()
      await expect(content).toBeVisible()
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')

      const triggerBox = await trigger.boundingBox()
      const contentBox = await content.boundingBox()
      expect(triggerBox).toBeTruthy()
      expect(contentBox).toBeTruthy()

      expect(contentBox!.y).toBeGreaterThanOrEqual(triggerBox!.y + triggerBox!.height - 2)
      expect(contentBox!.y).toBeLessThan(triggerBox!.y + triggerBox!.height + 24)
      expect(Math.abs(contentBox!.x - triggerBox!.x)).toBeLessThanOrEqual(16)

      await page.getByTestId('btn-close-dark-theme').click()
      await expect(content).toHaveCount(0)
    })
  })
})
