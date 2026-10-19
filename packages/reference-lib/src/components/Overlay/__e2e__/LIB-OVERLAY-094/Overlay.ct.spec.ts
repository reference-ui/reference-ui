/**
 * Overlay deep spec and production verification suite. Proves DOM anatomy,
 * controlled-open purity, Portal container contracts, edge/anchor
 * diagnostics, dismissal routing, isolation, and positioning against the
 * story fixtures in a real browser.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'
import type { Locator } from '@playwright/test'

test.describe('Overlay Deep SPEC & Production Verification Suite', () => {
  test.describe('OV-RESTORE-06 / OV-FOCUS-08: Focus robustness', () => {
    test('OV-FOCUS-08: Overlay resolves initial focus after Content mounts when its public ref and internal FocusLock ref are composed', async ({ mount, page, }) => {
      await mount('components/Overlay/Overlay/Focus')
      await expect(page.getByTestId('focus-fixture-root')).toBeVisible()

      await page.getByTestId('btn-open-focus-08').click()
      const content = page.getByTestId('focus-08-content')
      const target = page.getByTestId('focus-08-target')
      const refLog = page.getByTestId('focus-08-ref-log')
      const moveCount = page.getByTestId('focus-08-move-count')
      await expect(content).toBeVisible()
      await expect(target).toBeFocused()
      await expect(refLog).toContainText('attach')

      const movesAfterOpen = (await moveCount.textContent()) || ''
      const logAfterOpen = (await refLog.textContent()) || ''
      expect(Number(movesAfterOpen)).toBeGreaterThan(0)

      await page.evaluate(() => {
        ;(document.querySelector('[data-testid="btn-focus-08-rerender"]') as HTMLButtonElement).click()
      })
      await expect(content).toBeVisible()
      await expect(target).toBeFocused()
      await expect(moveCount).toHaveText(movesAfterOpen)
      await expect(refLog).toHaveText(logAfterOpen)
    })
  })
})
