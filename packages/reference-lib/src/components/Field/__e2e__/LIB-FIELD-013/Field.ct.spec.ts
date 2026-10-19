/**
 * Field browser proofs: DOM and ARIA surface plus embedded-chrome,
 * state-chrome, surface, layout, and composition rows. Mounts the story
 * fixtures and asserts the host stays roleless with status-only data
 * attributes in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Field CT', () => {
  test('FI-CSS-09: Field should match read-only chrome from [readonly] on the enclosed input', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/StateChromeFixture')

    const readonlyField = page.getByTestId('field-readonly-control')
    const normalFieldWithReadonlyBtn = page.getByTestId('field-readonly-button')

    await expect(readonlyField).toBeVisible()
    await page.waitForTimeout(300)

    const roBg = await readonlyField.evaluate(el => window.getComputedStyle(el).backgroundColor)
    const normalBg = await normalFieldWithReadonlyBtn.evaluate(el => window.getComputedStyle(el).backgroundColor)

    // Readonly input triggers read-only background surface
    expect(roBg).not.toBe(normalBg)
  })
});
