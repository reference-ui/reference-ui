/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('4. Outside Press & Pointer Mechanics', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Outside')
      await expect(page.getByTestId('outside-fixture-root')).toBeVisible()
    })

    test('OV-ISO-04: Overlay should defer outside-press only while inert isolation is on', async ({ mount, page, }) => {
      const btnOpenIsoTrue = page.getByTestId('btn-open-iso-true')
      const btnOpenIsoFalse = page.getByTestId('btn-open-iso-false')
      const contentTrue = page.getByTestId('content-iso-true')
      const contentFalse = page.getByTestId('content-iso-false')
      const log = page.getByTestId('iso-events-log')

      // 1. Isolating path (inert on): waits for deferred click, no dismiss at pointerdown
      await btnOpenIsoTrue.click()
      await expect(contentTrue).toBeVisible()
      await page.evaluate(() => {
        const target = document.elementFromPoint(450, 450) || document.documentElement
        const opts = {
          bubbles: true,
          cancelable: true,
          clientX: 450,
          clientY: 450,
          button: 0,
          buttons: 1,
          isPrimary: true,
        }
        target.dispatchEvent(new PointerEvent('pointerdown', opts))
      })
      await expect(log).toHaveText('open:true')
      await expect(contentTrue).toBeVisible()

      // Complete click -> dismisses
      await page.evaluate(() => {
        const target = document.elementFromPoint(450, 450) || document.documentElement
        const opts = {
          bubbles: true,
          cancelable: true,
          clientX: 450,
          clientY: 450,
          button: 0,
          buttons: 0,
          isPrimary: true,
        }
        target.dispatchEvent(new PointerEvent('pointerup', opts))
        target.dispatchEvent(new MouseEvent('click', opts))
      })
      await expect(contentTrue).toHaveCount(0)
      await expect(log).toContainText('dismiss:true')

      // 2. Non-isolating path (isolation={false}): dismisses on initial outside pointerdown event
      await btnOpenIsoFalse.click()
      await expect(contentFalse).toBeVisible()
      await page.mouse.move(450, 450)
      await page.mouse.down()
      // Immediate dismiss at pointerdown
      await expect(contentFalse).toHaveCount(0)
      await expect(log).toContainText('outside:false')
      await expect(log).toContainText('dismiss:false')
      await page.mouse.up()
    })
  })
})
