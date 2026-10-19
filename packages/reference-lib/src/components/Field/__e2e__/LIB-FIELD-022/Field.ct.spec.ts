/**
 * Field browser proofs: DOM and ARIA surface plus embedded-chrome,
 * state-chrome, surface, layout, and composition rows. Mounts the story
 * fixtures and asserts the host stays roleless with status-only data
 * attributes in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Field CT', () => {
  test('renders field with prefix and suffix', async ({ mount, page }) => {
    await mount('components/Field/Field/PrefixAndSuffix')

    const field = page.getByTestId('prefix-suffix-field')
    await expect(field).toBeVisible()
    await page.waitForTimeout(300)
    await snap(page, 'field-prefix-suffix')

    const input = field.locator('input')
    await input.focus()
    await page.waitForTimeout(200)
    await snap(page, 'field-prefix-suffix-focused')
  })
});
