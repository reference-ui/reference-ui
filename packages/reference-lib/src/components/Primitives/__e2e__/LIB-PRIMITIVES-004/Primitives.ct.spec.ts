/**
 * Primitives lib-smoke suite: the harness boots, the fixture root renders,
 * the React version reports valid, and form controls, button states, and
 * disclosure interactions behave. Case metadata lives in `case.json`;
 * this spec is the execution behind LIB-PRIMITIVES-001 through 004.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Primitives Suite (Lib Smoke)', () => {
  test('disclosure and native summary expand interactions', async ({ mount, page }) => {
    const component = await mount('components/Primitives/Primitives/Disclosure')
    await expect(component.getByRole('heading', { name: 'Disclosure & Dialog Surfaces', exact: true })).toBeVisible()

    await page.waitForTimeout(400)
    await snap(page, 'primitives-disclosure-resting')

    // Second details is closed by default, click to open
    const summaryBtn = component.getByText('Additional System Details')
    await summaryBtn.click()

    const expandedContent = component.getByText('Closed by default; click to expand without JavaScript state machinery.')
    await expect(expandedContent).toBeVisible()

    await page.waitForTimeout(400)
    await snap(page, 'primitives-disclosure-open')
  })
});
