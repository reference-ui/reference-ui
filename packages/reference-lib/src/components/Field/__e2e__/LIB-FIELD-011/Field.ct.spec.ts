/**
 * Field browser proofs: DOM and ARIA surface plus embedded-chrome,
 * state-chrome, surface, layout, and composition rows. Mounts the story
 * fixtures and asserts the host stays roleless with status-only data
 * attributes in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Field CT', () => {
  test('FI-CSS-07: Field should match invalid chrome through :has([aria-invalid="true"])', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/StateChromeFixture')

    const field = page.getByTestId('field-css7')
    const input = page.getByTestId('input-css7')
    const toggleBtn = page.getByTestId('btn-toggle-css7-invalid')

    await expect(field).toBeVisible()
    await page.waitForTimeout(300)
    await snap(page, 'field-state-chrome')

    const defaultBorder = await field.evaluate(el => window.getComputedStyle(el).borderColor)

    // Toggle invalid on (bezel border-color transitions over 150ms)
    await toggleBtn.click()
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await page.waitForTimeout(300)

    const invalidBorder = await field.evaluate(el => window.getComputedStyle(el).borderColor)
    expect(invalidBorder).not.toBe(defaultBorder)

    // Field itself never receives aria-invalid
    await expect(field).not.toHaveAttribute('aria-invalid')

    // Toggle invalid off
    await toggleBtn.click()
    await expect(input).not.toHaveAttribute('aria-invalid')
    await page.waitForTimeout(300)

    const resetBorder = await field.evaluate(el => window.getComputedStyle(el).borderColor)
    expect(resetBorder).not.toBe(invalidBorder)
  })
});
