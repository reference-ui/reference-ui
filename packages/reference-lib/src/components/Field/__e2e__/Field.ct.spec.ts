import { test, expect, snap } from '../../../../playwright/ct'

test.describe('Field CT', () => {
  test('renders div[data-reference-field] with no role and sets data-status=warning', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/StatusAndFocusFixture')

    const field = page.getByTestId('test-field')
    const input = page.getByTestId('field-input')

    await expect(field).toBeVisible()
    await expect(field).toHaveAttribute('data-reference-field', '')
    await expect(field).not.toHaveAttribute('role')
    await expect(field).not.toHaveAttribute('aria-invalid')

    // Enclosed input is invalid
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    const root = page.getByTestId('field-fixture-root')
    await page.waitForTimeout(300)
    await snap(page, 'field-resting')
    await snap(root, 'field-root-resting', { maxDiffPixelRatio: 0.001 })
    await snap(field, 'field-control-resting', { maxDiffPixelRatio: 0.001 })

    // Field status warning toggle
    await page.getByTestId('btn-toggle-warning').click()
    await expect(field).toHaveAttribute('data-status', 'warning')
    await page.waitForTimeout(300)
    await snap(page, 'field-status-warning')
    await snap(field, 'field-control-warning', { maxDiffPixelRatio: 0.001 })
  })

  test('mouse click changes border color without outline ring; keyboard tab applies focus ring', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/StatusAndFocusFixture')

    const standardField = page.getByTestId('standard-field')
    const standardInput = page.getByTestId('standard-field-input')

    // Initial state: outline is transparent/none
    const initialOutline = await standardField.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth }
    })
    expect(
      initialOutline.outlineStyle === 'none' ||
      initialOutline.outlineWidth === '0px' ||
      initialOutline.outlineStyle === 'solid',
    ).toBe(true)

    // Mouse click into input: focus triggered, but NOT :focus-visible
    await standardInput.click()
    await expect(standardInput).toBeFocused()
    await page.waitForTimeout(200)
    await snap(page, 'field-mouse-focused')

    const mouseClickStyles = await standardField.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
        borderColor: s.borderColor,
      }
    })

    // On mouse click: outline color is transparent (no visible focus ring)
    const isOutlineTransparent =
      mouseClickStyles.outlineStyle === 'none' ||
      mouseClickStyles.outlineWidth === '0px' ||
      mouseClickStyles.outlineColor === 'rgba(0, 0, 0, 0)' ||
      mouseClickStyles.outlineColor === 'transparent' ||
      mouseClickStyles.outlineColor.includes('/ 0)')

    expect(isOutlineTransparent).toBe(true)

    // Press Tab from toggle button to keyboard-focus into the input -> :focus-visible
    await page.getByTestId('btn-toggle-warning').focus()
    // Tab twice: once to test-field input, second to standard-field input
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await expect(standardInput).toBeFocused()

    // Wait for the focus transition to finish
    await page.waitForTimeout(200)
    await snap(page, 'field-keyboard-focused')

    const keyboardTabStyles = await standardField.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
        borderColor: s.borderColor,
      }
    })

    // On keyboard tab: focus ring outline is 2px solid and non-transparent
    expect(keyboardTabStyles.outlineStyle).toBe('solid')
    expect(keyboardTabStyles.outlineWidth).toBe('2px')
    expect(keyboardTabStyles.outlineColor.includes('/ 0)')).toBe(false)
    // Border color on keyboard tab stays subtle and does not duplicate the white outline ring
    expect(keyboardTabStyles.borderColor).not.toBe(mouseClickStyles.borderColor)
  })

  test('renders field with prefix and suffix', async ({ mount, page }) => {
    await mount('components/Field/Field/PrefixAndSuffix')

    const field = page.getByTestId('prefix-suffix-field')
    await expect(field).toBeVisible()
    await page.waitForTimeout(300)
    await snap(page, 'field-prefix-suffix')

    const input = field.locator('input')
    await input.focus()
    await page.waitForTimeout(200)
    await snap(page, 'field-prefix-suffix-focused')
  })
})
