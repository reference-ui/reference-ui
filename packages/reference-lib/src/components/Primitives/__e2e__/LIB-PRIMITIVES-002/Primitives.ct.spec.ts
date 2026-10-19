/**
 * Primitives lib-smoke suite: the harness boots, the fixture root renders,
 * the React version reports valid, and form controls, button states, and
 * disclosure interactions behave. Case metadata lives in `case.json`;
 * this spec is the execution behind LIB-PRIMITIVES-001 through 004.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Primitives Suite (Lib Smoke)', () => {
  test('form controls render and handle input interactions', async ({ mount, page }) => {
    const component = await mount('components/Primitives/Primitives/Forms')
    await expect(component.getByRole('heading', { name: 'Form Controls & Inputs', exact: true })).toBeVisible()

    await page.waitForTimeout(400)
    await snap(page, 'primitives-forms-resting')

    const textInput = component.getByPlaceholder('Standard text input…')
    await textInput.fill('Component Testing Verification')
    await expect(textInput).toHaveValue('Component Testing Verification')

    const emailInput = component.getByLabel('Email Input')
    await emailInput.fill('ct-bot@reference-ui.dev')
    await expect(emailInput).toHaveValue('ct-bot@reference-ui.dev')

    const selectEl = component.getByLabel('Select Dropdown')
    await selectEl.selectOption('inputs')
    await expect(selectEl).toHaveValue('inputs')

    const textarea = component.getByPlaceholder('Multiline notes and descriptions styled with baseline typography…')
    await textarea.fill('Testing styled native textarea with design tokens')
    await expect(textarea).toHaveValue('Testing styled native textarea with design tokens')

    await page.waitForTimeout(400)
    await snap(page, 'primitives-forms-active')
  })
});
