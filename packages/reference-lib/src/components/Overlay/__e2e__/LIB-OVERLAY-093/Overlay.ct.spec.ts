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
    test('OV-RESTORE-06: Overlay restores only the outer origin when closing a parent cascades through nested layers', async ({ mount, page, }) => {
      await mount('components/Overlay/Overlay/Nested')
      await expect(page.getByTestId('nested-fixture-root')).toBeVisible()

      const rootTrigger = page.getByTestId('btn-open-root-parent')
      await rootTrigger.focus()
      await page.keyboard.press('Enter')
      await expect(page.getByTestId('nested-parent-content')).toBeVisible()

      await page.getByTestId('btn-open-child').click()
      await expect(page.getByTestId('nested-child-content')).toBeVisible()
      await page.getByTestId('btn-open-grandchild').click()
      await expect(page.getByTestId('nested-grandchild-content')).toBeVisible()

      const focusedDuringClose: string[] = []
      await page.exposeFunction('ovRestore06Focus', (id: string) => {
        focusedDuringClose.push(id)
      })
      await page.evaluate(() => {
        document.addEventListener('focusin', e => {
          const id = (e.target as HTMLElement | null)?.getAttribute?.('data-testid') ?? ''
          ;(window as unknown as { ovRestore06Focus: (id: string) => void }).ovRestore06Focus(id)
        })
      })

      await page.getByTestId('btn-parent-close-inner').click()
      await expect(page.getByTestId('nested-grandchild-content')).toHaveCount(0)
      await expect(page.getByTestId('nested-child-content')).toHaveCount(0)
      await expect(page.getByTestId('nested-parent-content')).toHaveCount(0)

      await expect(rootTrigger).toBeFocused()
      expect(focusedDuringClose.filter(id => id === 'btn-open-child' || id === 'btn-open-grandchild')).toEqual([])
    })
  })
})
