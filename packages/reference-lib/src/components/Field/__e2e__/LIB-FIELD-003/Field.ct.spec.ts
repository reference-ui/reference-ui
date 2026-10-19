/**
 * Field browser proofs: DOM and ARIA surface plus embedded-chrome,
 * state-chrome, surface, layout, and composition rows. Mounts the story
 * fixtures and asserts the host stays roleless with status-only data
 * attributes in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Field CT', () => {
  test('FI-DOM-02: Field should not receive ARIA validity when the enclosed input is invalid', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/StatusAndFocusFixture')

    const field = page.getByTestId('test-field')
    const input = page.getByTestId('field-input')

    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(field).not.toHaveAttribute('aria-invalid')
    await expect(field).not.toHaveAttribute('aria-errormessage')
    await expect(field).not.toHaveAttribute('data-invalid')
  })
});
