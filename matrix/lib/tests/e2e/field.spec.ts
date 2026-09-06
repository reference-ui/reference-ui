import { expect, test } from '@playwright/test'

test.describe('Field Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/field')
    await expect(page.getByTestId('field-fixture-root')).toBeVisible()
  })

  test('FI-DOM-01, FI-DOM-02 & FI-DOM-03: Renders div[data-reference-field] with no role and sets data-status=warning', async ({
    page,
  }) => {
    const field = page.getByTestId('test-field')
    const input = page.getByTestId('field-input')

    await expect(field).toBeVisible()
    await expect(field).toHaveAttribute('data-reference-field', '')
    await expect(field).not.toHaveAttribute('role')
    await expect(field).not.toHaveAttribute('aria-invalid')

    // Enclosed input is invalid
    await expect(input).toHaveAttribute('aria-invalid', 'true')

    // Field status warning toggle
    await page.getByTestId('btn-toggle-warning').click()
    await expect(field).toHaveAttribute('data-status', 'warning')
  })

  test('FI-DOM-04: Mouse click changes border color without outline ring; Keyboard tab applies focus ring', async ({
    page,
  }) => {
    const standardField = page.getByTestId('standard-field')
    const standardInput = page.getByTestId('standard-field-input')

    // Initial state: outline is transparent/none
    const initialOutline = await standardField.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth }
    })
    expect(initialOutline.outlineStyle === 'none' || initialOutline.outlineWidth === '0px' || initialOutline.outlineStyle === 'solid').toBe(true)

    // Mouse click into input: focus triggered, but NOT :focus-visible
    await standardInput.click()
    await expect(standardInput).toBeFocused()

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

    // Wait for the 150ms focus transition to finish
    await page.waitForTimeout(200)

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
})
