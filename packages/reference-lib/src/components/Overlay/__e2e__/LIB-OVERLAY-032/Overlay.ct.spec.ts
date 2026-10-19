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

    test('OV-OUT-11: Overlay should retain cancelable geometric outside dismissal when no Backdrop part is authored', async ({
      page,
    }) => {
      const openBtn = page.getByTestId('btn-open-no-backdrop')
      const content = page.getByTestId('content-no-backdrop')
      const bgControl = page.getByTestId('btn-bg-control')
      const log = page.getByTestId('no-backdrop-log')
      const chkPrevent = page.getByTestId('chk-prevent-no-backdrop')

      // Path 1: Normal outside click calls granular outside then high-level dismiss; bg control is inert
      await openBtn.click()
      await expect(content).toBeVisible()

      // Click outside content (e.g. at x=400, y=400)
      await page.evaluate(() => {
        const target = document.elementFromPoint(400, 400) || document.documentElement
        const opts = {
          bubbles: true,
          cancelable: true,
          clientX: 400,
          clientY: 400,
          button: 0,
          buttons: 1,
          isPrimary: true,
        }
        target.dispatchEvent(new PointerEvent('pointerdown', opts))
        target.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }))
        target.dispatchEvent(new MouseEvent('click', opts))
      })
      await expect(content).toHaveCount(0)
      await expect(log).toContainText('outside')
      await expect(log).toContainText('dismiss')
      // Background control was inert and unactivated
      expect(await bgControl.textContent()).toBe('Background Control (0)')

      // Path 2: Prevented path skips onDismiss
      await chkPrevent.check()
      await openBtn.click()
      await expect(content).toBeVisible()

      // Click outside content
      await page.evaluate(() => {
        const target = document.elementFromPoint(400, 400) || document.documentElement
        const opts = {
          bubbles: true,
          cancelable: true,
          clientX: 400,
          clientY: 400,
          button: 0,
          buttons: 1,
          isPrimary: true,
        }
        target.dispatchEvent(new PointerEvent('pointerdown', opts))
        target.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }))
        target.dispatchEvent(new MouseEvent('click', opts))
      })
      // Assert prevented path skips onDismiss and overlay remains open
      await expect(content).toBeVisible()
      await expect(log).toContainText('outside')
      expect(await bgControl.textContent()).toBe('Background Control (0)')
    })
  })
})
