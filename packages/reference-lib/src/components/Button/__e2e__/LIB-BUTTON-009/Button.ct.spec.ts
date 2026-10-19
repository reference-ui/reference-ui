/**
 * Button browser proofs: resting variants and icon configurations plus
 * hover, active, focus, click, and disabled states with visual snaps.
 * Mounts the states fixtures; form-ownership contracts live in the
 * sibling contracts spec.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Button Component', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/Button/Button/ButtonStatesFixture')
    await expect(page.getByTestId('button-fixture-root')).toBeVisible()
  })

  test('BT-STATE-04: Icon button variants hover and focus states', async ({
    page,
  }) => {
    const btnLeading = page.getByTestId('btn-default-icon-leading')
    const btnTrailing = page.getByTestId('btn-default-icon-trailing')
    const btnIconOnly = page.getByTestId('btn-default-icon-only')

    // Leading icon hover
    await btnLeading.hover()
    await page.waitForTimeout(50)
    await snap(page, 'button-icon-leading-hover')

    // Trailing icon focus
    await btnTrailing.focus()
    await page.waitForTimeout(50)
    await snap(page, 'button-icon-trailing-focus')

    // Icon only hover
    await btnIconOnly.hover()
    await page.waitForTimeout(50)
    await snap(page, 'button-icon-only-hover')
  })
});
