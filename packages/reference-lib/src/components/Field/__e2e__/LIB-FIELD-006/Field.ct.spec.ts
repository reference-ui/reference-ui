/**
 * Field browser proofs: DOM and ARIA surface plus embedded-chrome,
 * state-chrome, surface, layout, and composition rows. Mounts the story
 * fixtures and asserts the host stays roleless with status-only data
 * attributes in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Field CT', () => {
  test('FI-CSS-01: Field should put a descendant Input into embedded mode', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/EmbeddedChromeFixture')

    const standaloneInput = page.getByTestId('standalone-input')
    const embeddedInput = page.getByTestId('embedded-input')
    const field = page.getByTestId('field-with-embedded-input')

    // Settle: computed chrome reads need the theme CSS applied
    await expect(field).toBeVisible()
    await page.waitForTimeout(300)

    const standaloneStyles = await standaloneInput.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        borderWidth: s.borderWidth,
        borderStyle: s.borderStyle,
      }
    })

    const embeddedStyles = await embeddedInput.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        borderWidth: s.borderWidth,
        borderStyle: s.borderStyle,
        backgroundColor: s.backgroundColor,
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
      }
    })

    const fieldStyles = await field.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        borderWidth: s.borderWidth,
        borderStyle: s.borderStyle,
      }
    })

    // Standalone has border
    expect(standaloneStyles.borderWidth).toBe('1px')
    expect(standaloneStyles.borderStyle).toBe('solid')

    // Embedded loses border, background, and outline
    expect(embeddedStyles.borderWidth).toBe('0px')
    expect(embeddedStyles.borderStyle).toBe('none')
    expect(
      embeddedStyles.backgroundColor === 'rgba(0, 0, 0, 0)' ||
      embeddedStyles.backgroundColor === 'transparent'
    ).toBe(true)
    expect(
      embeddedStyles.outlineWidth === '0px' ||
      embeddedStyles.outlineStyle === 'none' ||
      embeddedStyles.outlineColor === 'rgba(0, 0, 0, 0)' ||
      embeddedStyles.outlineColor === 'transparent' ||
      embeddedStyles.outlineColor.includes('/ 0)')
    ).toBe(true)

    // Field host carries the bezel border
    expect(fieldStyles.borderWidth).toBe('1px')
    expect(fieldStyles.borderStyle).toBe('solid')

    await page.waitForTimeout(300)
    await snap(page, 'field-embedded-chrome')
  })
});
