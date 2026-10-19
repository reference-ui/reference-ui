/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('OV-ESC-07: Native top-layer popover Escape', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Dialog')
      await expect(page.getByTestId('dialog-fixture-root')).toBeVisible()
    })

    test('OV-ESC-07: Overlay waits to handle Escape when a native top-layer popover consumes the first key', async ({ mount, page, }) => {
      await page.getByTestId('btn-open-esc-07').click()
      const content = page.getByTestId('esc-07-content')
      const nativePopover = page.getByTestId('native-popover')
      const log = page.getByTestId('esc-07-log')
      await expect(content).toBeVisible()
      await expect(log).toHaveText('open')

      await page.getByTestId('btn-show-native-popover').click()
      await expect
        .poll(async () => nativePopover.evaluate(el => el.matches(':popover-open')))
        .toBe(true)

      await page.getByTestId('btn-native-popover-inner').focus()
      await expect(page.getByTestId('btn-native-popover-inner')).toBeFocused()

      await page.keyboard.press('Escape')
      await expect
        .poll(async () => nativePopover.evaluate(el => el.matches(':popover-open')))
        .toBe(false)
      await expect(content).toBeVisible()
      await expect(log).toHaveText('open')

      await page.keyboard.press('Escape')
      await expect(content).toHaveCount(0)
      await expect(log).toContainText('escape')
      await expect(log).toContainText('dismiss')
    })
  })
})
