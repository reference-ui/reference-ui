import { expect, test, type Locator } from '@playwright/test'

test.describe('Combobox Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/combobox')
    await expect(page.getByTestId('combobox-fixture-root')).toBeVisible()
  })

  test('CB-DOM-01: Renders combobox input, opens popover on focus/click, selects option and closes', async ({
    page,
  }) => {
    const input = page.getByTestId('combobox-input')
    const popover = page.getByTestId('combobox-popover')
    const display = page.getByTestId('combobox-value-display')

    await expect(input).toHaveAttribute('role', 'combobox')
    await expect(input).toHaveAttribute('aria-autocomplete', 'list')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(popover).toHaveCount(0)

    // Focus input -> opens popover
    await input.click()
    await expect(input).toHaveAttribute('aria-expanded', 'true')
    await expect(popover).toBeVisible()
    await expectAnchoredBottomStart(input, popover)

    const optBanana = page.getByTestId('combo-opt-banana')
    await expect(optBanana).toBeVisible()
    const optBox = await optBanana.boundingBox()
    expect(optBox?.height).toBe(34)

    // Click Banana option -> selects banana and closes popover
    await optBanana.click()
    await expect(popover).toHaveCount(0)
    await expect(input).toHaveValue('banana')
    await expect(display).toHaveText('Selected: banana')
  })

  test('CB-DOM-02: Option in combobox displays checkmark indicator when selected, and has solid highlight on focus with no outline ring', async ({
    page,
  }) => {
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
})

async function expectAnchoredBottomStart(trigger: Locator, content: Locator) {
  const triggerBox = await trigger.boundingBox()
  const contentBox = await content.boundingBox()
  expect(triggerBox).toBeTruthy()
  expect(contentBox).toBeTruthy()

  expect(contentBox!.y).toBeGreaterThanOrEqual(triggerBox!.y + triggerBox!.height - 2)
  expect(contentBox!.y).toBeLessThan(triggerBox!.y + triggerBox!.height + 24)
  expect(Math.abs(contentBox!.x - triggerBox!.x)).toBeLessThan(16)
}
