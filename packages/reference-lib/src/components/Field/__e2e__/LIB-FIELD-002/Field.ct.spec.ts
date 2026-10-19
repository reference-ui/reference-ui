/**
 * Field browser proofs: DOM and ARIA surface plus embedded-chrome,
 * state-chrome, surface, layout, and composition rows. Mounts the story
 * fixtures and asserts the host stays roleless with status-only data
 * attributes in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Field CT', () => {
  test('FI-DOM-01: Field should render a wrapping div with no role and data-reference-field', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/StatusAndFocusFixture')

    const field = page.getByTestId('test-field')
    const input = page.getByTestId('field-input')

    await expect(field).toBeVisible()
    await expect(field).toHaveAttribute('data-reference-field', '')
    await expect(field).not.toHaveAttribute('role')
    await expect(input).toBeVisible()

    // Authored children stay in order: input is a descendant of field
    const parent = await input.evaluate(el => el.parentElement?.getAttribute('data-testid'))
    expect(parent).toBe('test-field')

    await page.waitForTimeout(300)
    await snap(page, 'field-resting')
    const root = page.getByTestId('field-fixture-root')
    await snap(root, 'field-root-resting', { maxDiffPixelRatio: 0.001 })
    await snap(field, 'field-control-resting', { maxDiffPixelRatio: 0.001 })
  })
});
