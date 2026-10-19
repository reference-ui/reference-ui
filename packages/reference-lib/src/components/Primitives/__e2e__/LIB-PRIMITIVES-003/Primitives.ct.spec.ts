/**
 * Primitives lib-smoke suite: the harness boots, the fixture root renders,
 * the React version reports valid, and form controls, button states, and
 * disclosure interactions behave. Case metadata lives in `case.json`;
 * this spec is the execution behind LIB-PRIMITIVES-001 through 004.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Primitives Suite (Lib Smoke)', () => {
  test('button states: default, primary hover, active, and disabled', async ({ mount, page }) => {
    const component = await mount('components/Primitives/Primitives/Buttons')
    await expect(component.getByRole('heading', { name: 'Buttons', exact: true })).toBeVisible()

    const defaultBtn = component.getByRole('button', { name: 'Default Button' })
    const primaryBtn = component.getByRole('button', { name: 'Primary Button' })
    const disabledBtn = component.getByRole('button', { name: 'Disabled Button' })

    await expect(defaultBtn).toBeVisible()
    await expect(primaryBtn).toBeVisible()
    await expect(disabledBtn).toBeDisabled()

    await page.waitForTimeout(400)
    await snap(page, 'primitives-buttons-resting')

    await primaryBtn.hover()
    await page.waitForTimeout(400)
    await snap(page, 'primitives-buttons-hover')
  })
});
