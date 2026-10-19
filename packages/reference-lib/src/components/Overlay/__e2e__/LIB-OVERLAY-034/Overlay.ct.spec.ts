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

    test('OV-FOCUS-09: Overlay should never treat focus movement by itself as an outside-dismiss command', async ({
      page,
    }) => {
      const openBtn = page.getByTestId('btn-open-focus-move')
      const content = page.getByTestId('focus-move-content')
      const innerBtn = page.getByTestId('btn-focus-move-inner')
      const outsideBtn = page.getByTestId('btn-focus-move-outside')
      const log = page.getByTestId('focus-move-log')

      // State 1: Open with initialFocus={false} while focus remains on the source
      await openBtn.focus()
      await openBtn.click()
      await expect(content).toBeVisible()
      await expect(log).toHaveText('open')
      await expect(content).toBeVisible()

      // State 2: Enter Content and programmatically focus an outside element without a pointer sequence
      await innerBtn.focus()
      await expect(innerBtn).toBeFocused()

      // Focus outside element programmatically
      await outsideBtn.evaluate((el: HTMLElement) => el.focus())

      // Assert FocusLock reclaims focus, and onOutsidePress/onDismiss remain empty
      await expect(innerBtn).toBeFocused()
      await expect(content).toBeVisible()
      await expect(log).toHaveText('open')
    })
  })
})
