/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

test.describe('Combobox CT', () => {
  test('displays checkmark indicator when selected, and has solid highlight on focus with no outline ring', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/FruitSelect')

    const input = page.getByTestId('combobox-input')
    const popover = page.getByTestId('combobox-popover')

    // Click input to open popover
    await input.click()
    await expect(popover).toBeVisible()

    const optBanana = page.getByTestId('combo-opt-banana')
    const optApple = page.getByTestId('combo-opt-apple')

    // Click Banana to select it
    await optBanana.click()
    await expect(popover).toHaveCount(0)

    // Re-open popover
    await input.click()
    await expect(popover).toBeVisible()
    await page.waitForTimeout(300)
    await snap(page, 'combobox-reopened-with-check')

    // Selected option has checkmark tick slot
    const bananaCheck = optBanana.locator('[data-slot="check"]')
    await expect(bananaCheck).toBeVisible()
    await expect(bananaCheck.locator('svg')).toBeVisible()

    // Unselected option does NOT have checkmark tick slot
    const appleCheck = optApple.locator('[data-slot="check"]')
    await expect(appleCheck).toHaveCount(0)

    // Focus apple option
    await optApple.focus()
    await expect(optApple).toBeFocused()
    await page.waitForTimeout(200)
    await snap(page, 'combobox-option-focused')

    const appleStyles = await optApple.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
        backgroundColor: s.backgroundColor,
      }
    })

    // No outline ring on focused combobox option
    const isOutlineAbsent =
      appleStyles.outlineStyle === 'none' ||
      appleStyles.outlineWidth === '0px' ||
      appleStyles.outlineColor === 'rgba(0, 0, 0, 0)' ||
      appleStyles.outlineColor === 'transparent' ||
      appleStyles.outlineColor.includes('/ 0)')

    expect(isOutlineAbsent).toBe(true)

    // Solid background on focused option
    expect(appleStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(appleStyles.backgroundColor).not.toBe('transparent')
    expect(appleStyles.backgroundColor.includes('/ 0)')).toBe(false)
  })
});
