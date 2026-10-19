/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('Anchored Floating UI & Arrow Contracts (OV-POS-*)', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Anchor')
      await expect(page.getByTestId('anchor-fixture-root')).toBeVisible()
    })

    test('OV-POS-09 / OV-TRG-06: Overlay accepts virtual anchors as positioning references while Trigger remains interaction source', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      const trigger = page.getByTestId('btn-virtual-trigger')
      const content = page.getByTestId('content-virtual')
      const moveBtn = page.getByTestId('btn-move-virtual-coords')
      const sizedBtn = page.getByTestId('btn-set-sized-virtual')

      // Initial state: closed, trigger has aria-expanded="false"
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await expect(content).toHaveCount(0)

      // Open from Trigger
      await trigger.click()
      await expect(content).toBeVisible()
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')

      // Point anchor (300, 300) has implicit zero size:
      // default placement is bottom-start with 8px offset:
      // left should be 300, top should be 300 + 8 = 308
      const box1 = (await content.boundingBox())!
      expect(Math.abs(box1.x - 300)).toBeLessThanOrEqual(2)
      expect(Math.abs(box1.y - 308)).toBeLessThanOrEqual(2)

      // Published CSS variables: point anchor has 0px anchor width and height
      const vars1 = await content.evaluate(el => ({
        width: (el as HTMLElement).style.getPropertyValue('--reference-overlay-anchor-width'),
        height: (el as HTMLElement).style.getPropertyValue('--reference-overlay-anchor-height'),
      }))
      expect(vars1.width).toBe('0px')
      expect(vars1.height).toBe('0px')

      // Mutate coordinates to (450, 500)
      await moveBtn.click()
      const box2 = (await content.boundingBox())!
      expect(Math.abs(box2.x - 450)).toBeLessThanOrEqual(2)
      expect(Math.abs(box2.y - 508)).toBeLessThanOrEqual(2)

      // Switch to sized virtual anchor (400, 200, width: 100, height: 50)
      await sizedBtn.click()
      const box3 = (await content.boundingBox())!
      // bottom-start of 400, 200 with height 50 and offset 8: x = 400, y = 200 + 50 + 8 = 258
      expect(Math.abs(box3.x - 400)).toBeLessThanOrEqual(2)
      expect(Math.abs(box3.y - 258)).toBeLessThanOrEqual(2)
      const vars3 = await content.evaluate(el => ({
        width: (el as HTMLElement).style.getPropertyValue('--reference-overlay-anchor-width'),
        height: (el as HTMLElement).style.getPropertyValue('--reference-overlay-anchor-height'),
      }))
      expect(vars3.width).toBe('100px')
      expect(vars3.height).toBe('50px')

      // OV-TRG-06: Trigger remains interaction source (dismiss request while open)
      await trigger.click()
      await expect(content).toHaveCount(0)
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })
  })
})
