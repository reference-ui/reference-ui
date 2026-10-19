/**
 * Field browser proofs: DOM and ARIA surface plus embedded-chrome,
 * state-chrome, surface, layout, and composition rows. Mounts the story
 * fixtures and asserts the host stays roleless with status-only data
 * attributes in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Field CT', () => {
  test('FI-CSS-05: mouse click changes border color without outline ring; keyboard tab applies focus ring', async ({
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
    const tabInputStyles = await standardInput.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
      }
    })

    // On keyboard tab: focus ring outline is 2px solid and non-transparent
    expect(keyboardTabStyles.outlineStyle).toBe('solid')
    expect(keyboardTabStyles.outlineWidth).toBe('2px')
    expect(keyboardTabStyles.outlineColor.includes('/ 0)')).toBe(false)
    // Border color on keyboard tab stays subtle and does not duplicate the white outline ring
    expect(keyboardTabStyles.borderColor).not.toBe(mouseClickStyles.borderColor)

    // The visible ring is on Field, not on the enclosed Input
    expect(
      tabInputStyles.outlineWidth === '0px' ||
      tabInputStyles.outlineStyle === 'none' ||
      tabInputStyles.outlineColor === 'rgba(0, 0, 0, 0)' ||
      tabInputStyles.outlineColor === 'transparent' ||
      tabInputStyles.outlineColor.includes('/ 0)')
    ).toBe(true)
  })
});
