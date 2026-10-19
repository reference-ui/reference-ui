/**
 * Field browser proofs: DOM and ARIA surface plus embedded-chrome,
 * state-chrome, surface, layout, and composition rows. Mounts the story
 * fixtures and asserts the host stays roleless with status-only data
 * attributes in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Field CT', () => {
  test('FI-CSS-02: Field should leave a sibling Input outside Field fully chromed', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/EmbeddedChromeFixture')

    const embeddedInput = page.getByTestId('embedded-input')
    const siblingInput = page.getByTestId('sibling-input')

    await expect(siblingInput).toBeVisible()
    await page.waitForTimeout(300)

    const embeddedStyles = await embeddedInput.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { borderWidth: s.borderWidth, borderStyle: s.borderStyle }
    })

    const siblingStyles = await siblingInput.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { borderWidth: s.borderWidth, borderStyle: s.borderStyle }
    })

    // Embedded inside Field loses border
    expect(embeddedStyles.borderWidth).toBe('0px')
    expect(embeddedStyles.borderStyle).toBe('none')

    // Sibling outside Field retains standalone border
    expect(siblingStyles.borderWidth).toBe('1px')
    expect(siblingStyles.borderStyle).toBe('solid')
  })
});
