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

    test('OV-OUT-04: Overlay should not immediately dismiss when the pointerdown that opens it is also outside its newly mounted Content', async ({
      page,
    }) => {
      const openBtn = page.getByTestId('btn-open-same-tick')
      const content = page.getByTestId('same-tick-content')
      const backdrop = page.getByTestId('same-tick-backdrop')
      const log = page.getByTestId('same-tick-log')

      await expect(content).toHaveCount(0)

      // Primary pointerdown opens the layer; document listeners settle normally
      await openBtn.dispatchEvent('pointerdown', { button: 0, isPrimary: true })
      await expect(content).toBeVisible()

      // Assert opening event produces no onOutsidePress or onDismiss, Content stays open
      await expect(log).toHaveText('pointerdown:open')
      await expect(content).toBeVisible()

      // Later independent outside sequence requests close
      await backdrop.click({ position: { x: 10, y: 10 } })
      await expect(content).toHaveCount(0)
      await expect(log).toContainText('outside')
      await expect(log).toContainText('dismiss')
    })
  })
})
