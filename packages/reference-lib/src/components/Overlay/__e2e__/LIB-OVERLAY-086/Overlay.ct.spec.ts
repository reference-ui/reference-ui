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

    test('OV-TRG-05 reject: Tab-bridge exit stands on the after-Trigger stop when the parent rejects close (FEATURES #6)', async ({
      page,
    }) => {
      const openTrg = page.getByTestId('btn-open-trg-05-reject')
      const content = page.getByTestId('trg-05-reject-content')
      const inner1 = page.getByTestId('btn-trg-05-reject-inner-1')
      const inner2 = page.getByTestId('btn-trg-05-reject-inner-2')
      const afterTrg = page.getByTestId('btn-after-trg-05-reject')
      const dismissCountEl = page.getByTestId('trg-05-reject-dismiss-count')
      const logEl = page.getByTestId('trg-05-reject-log')

      await openTrg.click()
      // reject: WebKit clicks never focus —
      // deliver the Chromium focus state; the Tab bridge starts from the trigger.
      if (isWebKit(page)) await openTrg.focus()
      await expect(content).toBeVisible()
      await expect(openTrg).toBeFocused()

      // pressTab: Option+Tab on WebKit; bridge handler keys on e.key === 'Tab'.
      await pressTab(page)
      await expect(inner1).toBeFocused()

      await pressTab(page)
      await expect(inner2).toBeFocused()

      // Optimistic-stands: one dismiss request, focus advances relative to
      // the Trigger and stays there, open DOM is retained.
      await pressTab(page)
      await expect(afterTrg).toBeFocused()
      await expect(content).toBeVisible()
      await expect(dismissCountEl).toHaveText('1')
      await expect(logEl).toHaveText('request:true,request:false')
    })
  })
})
