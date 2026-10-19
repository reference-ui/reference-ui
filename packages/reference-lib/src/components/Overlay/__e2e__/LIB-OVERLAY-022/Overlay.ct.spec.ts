/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
    test('OV-LAYER-11 & OV-ESC-08 & OV-OUT-12: one layer entry per coordinator pair, branched; granular handlers receive real DOM events', async ({ mount, page, }) => {
      await mount('components/Overlay/Overlay/Accounting')
      await expect(page.getByTestId('accounting-fixture-root')).toBeVisible()

      const layers = page.getByTestId('acct-layers')
      const log = page.getByTestId('acct-log')
      await expect(layers).toHaveText('count:0,open:0,roots:0,linked:true')

      // One entry for the dialog pair.
      await page.getByTestId('btn-open-acct-dialog').click()
      const dialog = page.getByTestId('acct-dialog-content')
      await expect(dialog).toBeVisible()
      await expect(layers).toHaveText('count:1,open:1,roots:1,linked:true')

      // A second entry for the popover pair, branched under the dialog —
      // not a second root layer.
      await page.getByTestId('btn-open-acct-pop').click()
      const pop = page.getByTestId('acct-pop-content')
      await expect(pop).toBeVisible()
      await expect(layers).toHaveText('count:2,open:2,roots:1,linked:true')

      // Escape: one granular-before-high-level sequence, real KeyboardEvent.
      await page.keyboard.press('Escape')
      await expect(pop).toHaveCount(0)
      await expect(dialog).toBeVisible()
      await expect(log).toHaveText('escape:KeyboardEvent,dismiss')
      await expect(layers).toHaveText('count:1,open:1,roots:1,linked:true')

      // Outside press inside the dialog but outside the popover: one
      // outside→interact→dismiss sequence, real PointerEvents, popover only.
      // (No UI log-clear: any light-DOM click lands on the modal backdrop.)
      await page.getByTestId('btn-open-acct-pop').click()
      await expect(pop).toBeVisible()
      await expect(layers).toHaveText('count:2,open:2,roots:1,linked:true')
      await page.getByTestId('acct-dialog-backdrop').click({ position: { x: 10, y: 10 } })
      await expect(pop).toHaveCount(0)
      await expect(dialog).toBeVisible()
      await expect(log).toHaveText(
        'escape:KeyboardEvent,dismiss,outside:PointerEvent,interact:PointerEvent,dismiss'
      )
      await expect(layers).toHaveText('count:1,open:1,roots:1,linked:true')

      // Closing the dialog empties the stack.
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
      await expect(layers).toHaveText('count:0,open:0,roots:0,linked:true')
    })
})
