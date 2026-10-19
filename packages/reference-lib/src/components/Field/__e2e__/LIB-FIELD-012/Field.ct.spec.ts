/**
 * Field browser proofs: DOM and ARIA surface plus embedded-chrome,
 * state-chrome, surface, layout, and composition rows. Mounts the story
 * fixtures and asserts the host stays roleless with status-only data
 * attributes in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Field CT', () => {
  test('FI-CSS-08: Field should match disabled chrome from the enclosed control, not a nested Button', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/StateChromeFixture')

    const disabledField = page.getByTestId('field-disabled-control')
    const activeFieldWithDisabledBtn = page.getByTestId('field-disabled-button')

    await expect(disabledField).toBeVisible()
    await page.waitForTimeout(300)

    const disabledControlStyles = await disabledField.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { opacity: s.opacity, cursor: s.cursor }
    })

    const activeControlStyles = await activeFieldWithDisabledBtn.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { opacity: s.opacity, cursor: s.cursor }
    })

    // Bezel with disabled input has disabled opacity and cursor
    expect(Number(disabledControlStyles.opacity)).toBeCloseTo(0.5, 1)
    expect(disabledControlStyles.cursor).toBe('not-allowed')

    // Bezel with only disabled button retains normal opacity
    expect(Number(activeControlStyles.opacity)).toBeCloseTo(1, 1)
    expect(activeControlStyles.cursor).not.toBe('not-allowed')
  })
});
