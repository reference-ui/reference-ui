/**
 * Field browser proofs: DOM and ARIA surface plus embedded-chrome,
 * state-chrome, surface, layout, and composition rows. Mounts the story
 * fixtures and asserts the host stays roleless with status-only data
 * attributes in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Field CT', () => {
  test('FI-DOM-02 (runtime): Field strips prohibited role and ARIA props from JS callers', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/ProhibitedPropsFixture')

    const field = page.getByTestId('prohibited-props-field')
    await expect(field).toBeVisible()

    // Prohibited surface never reaches the host, even when spread by JS
    await expect(field).not.toHaveAttribute('role')
    await expect(field).not.toHaveAttribute('aria-invalid')
    await expect(field).not.toHaveAttribute('aria-disabled')
    await expect(field).not.toHaveAttribute('aria-readonly')
    await expect(field).not.toHaveAttribute('aria-required')
    await expect(field).not.toHaveAttribute('aria-errormessage')

    // Host pins cannot be spoofed through the spread
    await expect(field).toHaveAttribute('data-reference-field', '')
    await expect(field).not.toHaveAttribute('data-status')

    await page.waitForTimeout(300)
    await snap(page, 'field-prohibited-props')
  })
});
