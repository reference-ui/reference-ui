/**
 * Field browser proofs: DOM and ARIA surface plus embedded-chrome,
 * state-chrome, surface, layout, and composition rows. Mounts the story
 * fixtures and asserts the host stays roleless with status-only data
 * attributes in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Field CT', () => {
  test('FI-DOM-03: Field should set data-status="warning" only when status is warning', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/StatusAndFocusFixture')

    const field = page.getByTestId('test-field')

    // Initial omitted status
    await expect(field).not.toHaveAttribute('data-status')
    await expect(field).not.toHaveAttribute('aria-invalid')

    // Toggle warning on
    await page.getByTestId('btn-toggle-warning').click()
    await expect(field).toHaveAttribute('data-status', 'warning')
    await expect(field).not.toHaveAttribute('aria-invalid')
    await page.waitForTimeout(300)
    await snap(page, 'field-status-warning')
    await snap(field, 'field-control-warning', { maxDiffPixelRatio: 0.001 })

    // Toggle warning off
    await page.getByTestId('btn-toggle-warning').click()
    await expect(field).not.toHaveAttribute('data-status')
  })
});
