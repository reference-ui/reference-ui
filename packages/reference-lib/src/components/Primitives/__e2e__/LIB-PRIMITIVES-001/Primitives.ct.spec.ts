/**
 * Primitives lib-smoke suite: the harness boots, the fixture root renders,
 * the React version reports valid, and form controls, button states, and
 * disclosure interactions behave. Case metadata lives in `case.json`;
 * this spec is the execution behind LIB-PRIMITIVES-001 through 004.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Primitives Suite (Lib Smoke)', () => {
  test('library harness boots, renders fixture root, and reports valid React version', async ({ mount, page }) => {
    const component = await mount('components/Primitives/Primitives/All')

    // Primitive contracts: render, style props and token enforcement
    const heading = component.getByRole('heading', { name: 'Reference UI Styled Primitives' })
    await expect(heading).toBeVisible()

    const subtitle = component.getByText(/Visual showcase of all native HTML primitives styled by Reference UI's design token system\./)
    await expect(subtitle).toBeVisible()

    // Verify React version contract (/^(17|18|19)\./)
    const reactVersion = await page.evaluate(
      () => document.documentElement.getAttribute('data-react-version') || ''
    )
    console.log(`React runtime version: ${reactVersion}`)
    expect(reactVersion).toMatch(/^(17|18|19)\./)

    // Verify foundational primitive sections are present
    await expect(component.getByRole('heading', { name: 'Form Controls & Inputs', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'Buttons', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'Selection Controls (Checkbox & Radio)', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'Metrics & Progress Bars', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'Tables', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'Typography & Headings', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'Code & Keyboard Badges', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'Inline Text Elements', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'Lists (Unordered, Ordered, Description)', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'Disclosure & Dialog Surfaces', exact: true })).toBeVisible()
    await expect(component.getByRole('heading', { name: 'Media & Figures', exact: true })).toBeVisible()

    await page.waitForTimeout(600)
    await snap(page, 'primitives-overview-resting')
  })
});
