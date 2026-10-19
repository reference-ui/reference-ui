/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('12. Trigger Interaction Suite (OV-TRG-03, OV-TRG-04, OV-TRG-05)', () => {
    test.beforeEach(async ({ mount, page }) => {
      await mount('components/Overlay/Overlay/Dialog')
      await expect(page.getByTestId('dialog-fixture-root')).toBeVisible()
    })

    test('OV-TRG-05: Bridges Tab from Trigger into Content when isolation focus is off, advances past Trigger and dismisses on exit', async ({ mount, page, }) => {
      const openTrg = page.getByTestId('btn-open-trg-05')
      const content = page.getByTestId('trg-05-content')
      const inner1 = page.getByTestId('btn-trg-05-inner-1')
      const inner2 = page.getByTestId('btn-trg-05-inner-2')
      const afterTrg = page.getByTestId('btn-after-trg-05')
      const dismissCountEl = page.getByTestId('trg-05-dismiss-count')

      // Open modeless overlay from Trigger
      await openTrg.click()
      // WebKit clicks never focus buttons —
      // deliver the Chromium focus state; the Tab bridge starts from the trigger.
      if (isWebKit(page)) await openTrg.focus()
      await expect(content).toBeVisible()
      await expect(openTrg).toBeFocused()

      // Tab from Trigger into Content (pressTab: Option+Tab on WebKit reaches
      // implicit destinations; the bridge handler keys on e.key === 'Tab').
      await pressTab(page)
      await expect(inner1).toBeFocused()

      // Tab to second control
      await pressTab(page)
      await expect(inner2).toBeFocused()

      // Tab past last control advances relative to Trigger (to afterTrg) and fires onDismiss
      await pressTab(page)
      await expect(afterTrg).toBeFocused()
      await expect(content).toHaveCount(0)
      await expect(dismissCountEl).toHaveText('1')
    })
  })
})
