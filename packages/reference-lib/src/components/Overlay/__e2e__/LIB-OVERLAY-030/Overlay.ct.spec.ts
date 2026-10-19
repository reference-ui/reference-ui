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

    test('OV-OUT-07: Overlay stays open when an unregistered extension overlay stops later events of a deferred outside sequence', async ({
      page,
    }) => {
      await page.getByTestId('btn-open-outside-dialog').click()
      const content = page.getByTestId('outside-content')
      const log = page.getByTestId('outside-events-log')
      await expect(content).toBeVisible()
      await expect(log).toHaveText('open')

      // Password-manager-style sibling: pointerdown is not stopped, but
      // mousedown/mouseup/click are. Overlay must defer and then drop the
      // sequence when the matching click never reaches the document.
      await page.evaluate(() => {
        const el = document.querySelector('[data-testid="btn-extension-control"]') as HTMLElement
        el.dispatchEvent(
          new PointerEvent('pointerdown', {
            bubbles: true,
            composed: true,
            cancelable: true,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true,
            button: 0,
          })
        )
        el.dispatchEvent(
          new MouseEvent('mousedown', {
            bubbles: true,
            composed: true,
            cancelable: true,
            button: 0,
          })
        )
        el.dispatchEvent(
          new PointerEvent('pointerup', {
            bubbles: true,
            composed: true,
            cancelable: true,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true,
            button: 0,
          })
        )
        el.dispatchEvent(
          new MouseEvent('mouseup', {
            bubbles: true,
            composed: true,
            cancelable: true,
            button: 0,
          })
        )
        el.dispatchEvent(
          new MouseEvent('click', {
            bubbles: true,
            composed: true,
            cancelable: true,
            button: 0,
          })
        )
      })

      await expect(content).toBeVisible()
      await expect(log).not.toContainText('outside')
      await expect(log).not.toContainText('dismiss')
      await expect(log).toContainText('extension:activate')
    })
  })
})
