/**
 * Field browser proofs: DOM and ARIA surface plus embedded-chrome,
 * state-chrome, surface, layout, and composition rows. Mounts the story
 * fixtures and asserts the host stays roleless with status-only data
 * attributes in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Field CT', () => {
  test('FI-CSS-10: Field should show warning chrome from data-status without implying invalid', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/StateChromeFixture')

    const field = page.getByTestId('field-warning-stack')
    const input = page.getByTestId('input-warning-stack')
    const toggleBtn = page.getByTestId('btn-toggle-css10-invalid')

    await expect(field).toBeVisible()
    await page.waitForTimeout(300)

    await expect(field).toHaveAttribute('data-status', 'warning')
    await expect(field).not.toHaveAttribute('aria-invalid')
    await expect(input).not.toHaveAttribute('aria-invalid')

    const defaultBorder = await page.getByTestId('field-css7').evaluate(el => window.getComputedStyle(el).borderColor)
    const warningBorder = await field.evaluate(el => window.getComputedStyle(el).borderColor)
    expect(warningBorder).not.toBe(defaultBorder)

    // Add aria-invalid="true" to Input: invalid stacks on warning
    await toggleBtn.click()
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await page.waitForTimeout(300)

    const stackedBorder = await field.evaluate(el => window.getComputedStyle(el).borderColor)
    expect(stackedBorder).not.toBe(warningBorder)
    expect(stackedBorder).not.toBe(defaultBorder)
    // But data-status="warning" is NOT cleared
    await expect(field).toHaveAttribute('data-status', 'warning')
    // Field itself still has NO aria-invalid
    await expect(field).not.toHaveAttribute('aria-invalid')
  })
});
