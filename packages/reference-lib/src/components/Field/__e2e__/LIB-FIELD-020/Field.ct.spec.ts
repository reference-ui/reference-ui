/**
 * Field browser proofs: DOM and ARIA surface plus embedded-chrome,
 * state-chrome, surface, layout, and composition rows. Mounts the story
 * fixtures and asserts the host stays roleless with status-only data
 * attributes in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Field CT', () => {
  test('FI-COMP-03: NumberField.Group should consume the Field recipe without a nested Field', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/CompoundEmbedFixture')

    const group = page.getByTestId('comp-numberfield-group')
    const input = page.getByTestId('comp-number-input')

    await expect(input).toBeVisible()
    await page.waitForTimeout(300)

    // Group is div[role="group"][data-reference-field]
    await expect(group).toHaveAttribute('role', 'group')
    await expect(group).toHaveAttribute('data-reference-field', '')

    // Input is embedded
    const inputStyles = await input.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { borderWidth: s.borderWidth, borderStyle: s.borderStyle }
    })
    expect(inputStyles.borderWidth).toBe('0px')

    // No separate nested Field node inside group
    const nestedFieldCount = await group.locator('> [data-reference-field]').count()
    expect(nestedFieldCount).toBe(0)

    // Application error fixture: wrapping Group in Field produces two distinct bezels
    const doubleWrapper = page.getByTestId('comp-double-bezel-wrapper')
    const doubleInner = page.getByTestId('comp-double-bezel-inner')
    await expect(doubleWrapper).toHaveAttribute('data-reference-field', '')
    await expect(doubleInner).toHaveAttribute('data-reference-field', '')
  })
});
