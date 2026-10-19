/**
 * Field browser proofs: DOM and ARIA surface plus embedded-chrome,
 * state-chrome, surface, layout, and composition rows. Mounts the story
 * fixtures and asserts the host stays roleless with status-only data
 * attributes in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Field CT', () => {
  test('FI-COMP-01: Field should keep Label htmlFor on the input in the amount composition', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/AmountFixture')

    const label = page.getByTestId('amount-label')
    const field = page.getByTestId('amount-field')
    const input = page.getByTestId('amount-input')
    const errorMsg = page.getByTestId('amount-error-msg')

    // Label htmlFor matches input id
    await expect(label).toHaveAttribute('for', 'amount-input')
    await expect(input).toHaveAttribute('id', 'amount-input')

    // Clicking label focuses input
    await label.click()
    await expect(input).toBeFocused()

    // Field has no role and no AT attributes
    await expect(field).not.toHaveAttribute('role')
    await expect(field).not.toHaveAttribute('aria-invalid')
    await expect(field).not.toHaveAttribute('aria-describedby')

    // AT attributes live on Input
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveAttribute('aria-describedby', 'amount-error')
    await expect(errorMsg).toHaveAttribute('id', 'amount-error')
  })
});
