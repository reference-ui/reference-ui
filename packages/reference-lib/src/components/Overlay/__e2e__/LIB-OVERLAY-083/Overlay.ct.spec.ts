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

    test('OV-TRG-03: Trigger requests open and dismiss from unprevented activation (click, enter, space); prevented and disabled are ignored', async ({
      page,
    }) => {
      const normalTrg = page.getByTestId('trg-03-normal')
      const normalContent = page.getByTestId('trg-03-normal-content')
      const logEl = page.getByTestId('trg-03-log')
      const resetBtn = page.getByTestId('btn-reset-trg-03-log')

      // 1. Click normal Trigger closed -> opens
      await resetBtn.click()
      await normalTrg.click()
      await expect(normalContent).toBeVisible()
      await expect(logEl).toHaveText('consumerClick,onOpen')

      // Click normal Trigger open -> dismisses
      await normalTrg.click()
      await expect(normalContent).toHaveCount(0)
      await expect(logEl).toHaveText('consumerClick,onOpen,consumerClick,onDismiss')

      // 2. Enter normal Trigger closed -> opens
      await resetBtn.click()
      await normalTrg.focus()
      await page.keyboard.press('Enter')
      await expect(normalContent).toBeVisible()
      await expect(logEl).toHaveText('consumerClick,onOpen')

      // Enter normal Trigger open -> dismisses
      await page.keyboard.press('Enter')
      await expect(normalContent).toHaveCount(0)
      await expect(logEl).toHaveText('consumerClick,onOpen,consumerClick,onDismiss')

      // 3. Space normal Trigger closed -> opens
      await resetBtn.click()
      await normalTrg.focus()
      await page.keyboard.press('Space')
      await expect(normalContent).toBeVisible()
      await expect(logEl).toHaveText('consumerClick,onOpen')

      // Space normal Trigger open -> dismisses
      await page.keyboard.press('Space')
      await expect(normalContent).toHaveCount(0)
      await expect(logEl).toHaveText('consumerClick,onOpen,consumerClick,onDismiss')

      // 4. Prevented Trigger: consumer preventDefault() cancels open request
      await resetBtn.click()
      const preventedTrg = page.getByTestId('trg-03-prevented')
      const preventedContent = page.getByTestId('trg-03-prevented-content')
      await preventedTrg.click()
      await expect(preventedContent).toHaveCount(0)
      await expect(logEl).toHaveText('consumerPrevented')

      // 5. Disabled Trigger: no open requests on click, Enter, Space
      await resetBtn.click()
      const disabledTrg = page.getByTestId('trg-03-disabled')
      const disabledContent = page.getByTestId('trg-03-disabled-content')
      await disabledTrg.click({ force: true })
      await expect(disabledContent).toHaveCount(0)
      await disabledTrg.focus()
      await page.keyboard.press('Enter')
      await page.keyboard.press('Space')
      await expect(disabledContent).toHaveCount(0)
      await expect(logEl).toHaveText('')
    })
  })
})
