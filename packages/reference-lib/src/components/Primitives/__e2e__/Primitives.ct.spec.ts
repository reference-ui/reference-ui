import { test, expect, snap } from '../../../../playwright/ct'

test.describe('Primitives Suite (Lib Smoke)', () => {
  test('library harness boots, renders fixture root, and reports valid React version', async ({ mount, page }) => {
    const component = await mount('components/Primitives/Primitives/All')

    // Contracts ported from matrix/lib/smoke.spec.ts
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
})
