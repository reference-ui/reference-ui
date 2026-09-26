import { test, expect, snap } from '../../../../playwright/ct'

test.describe('DateField CT', () => {
  test('renders compound DateField, opens picker on trigger click, selects date and updates', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/CompoundFixture')

    const input = page.getByTestId('date-field-input')
    const trigger = page.getByTestId('date-field-trigger')
    const picker = page.getByTestId('date-field-picker')
    const display = page.getByTestId('date-field-value-display')

    await expect(input).toHaveValue('2026-08-15')
    await expect(display).toHaveText('Date Value: 2026-08-15')
    await expect(picker).toHaveCount(0)
    await page.waitForTimeout(300)
    await snap(page, 'datefield-resting')

    // Hover trigger button
    await trigger.hover()
    await page.waitForTimeout(200)
    await snap(page, 'datefield-trigger-hover')

    // Click trigger -> opens picker
    await trigger.click()
    await expect(picker).toBeVisible()
    await page.waitForTimeout(300)
    await snap(page, 'datefield-picker-open')

    // Find and click August 25, 2026
    const day25 = page.locator('button[data-date="2026-08-25"]')
    await expect(day25).toBeVisible()
    await day25.hover()
    await page.waitForTimeout(200)
    await snap(page, 'datefield-day-hover')

    await day25.click()
    await expect(picker).toHaveCount(0)
    await expect(input).toHaveValue('2026-08-25')
    await expect(display).toHaveText('Date Value: 2026-08-25')
    await page.waitForTimeout(300)
    await snap(page, 'datefield-selected')
  })

  test('renders exactly one input and one trigger without duplicate synthesis', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/CompoundFixture')

    const root = page.getByTestId('date-field-fixture-root')
    const inputs = root.locator('input:not([type="hidden"])')
    const buttons = root.locator('button')

    await expect(inputs).toHaveCount(1)
    await expect(buttons).toHaveCount(1)
  })

  test('opens picker via Alt+ArrowDown and deliberate input click', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/CompoundFixture')

    const input = page.getByTestId('date-field-input')
    const picker = page.getByTestId('date-field-picker')

    await expect(picker).toHaveCount(0)

    // Alt + ArrowDown opens picker
    await input.focus()
    await page.waitForTimeout(200)
    await snap(page, 'datefield-input-focused')

    await page.keyboard.press('Alt+ArrowDown')
    await expect(picker).toBeVisible()
    await page.waitForTimeout(300)
    await snap(page, 'datefield-alt-down-open')

    // Escape closes picker
    await page.keyboard.press('Escape')
    await expect(picker).toHaveCount(0)
    await page.waitForTimeout(200)
    await snap(page, 'datefield-escaped')

    // Direct click on input opens picker
    await input.click()
    await expect(picker).toBeVisible()
  })
})

test.describe('DateField quarantine re-targets', () => {
  test('DF-DOM-01: childless DateField resolves directly to one visible text input', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/ChildlessFixture')

    const root = page.getByTestId('childless-fixture-root')
    const inputs = root.locator('input:not([type="hidden"])')
    await expect(inputs).toHaveCount(1)

    const input = root.locator('#bday-childless')
    await expect(input).toBeVisible()
    await expect(input).toHaveAttribute('type', 'text')
    await expect(input).not.toHaveAttribute('role', 'combobox')
    await expect(input).not.toHaveAttribute('role', 'spinbutton')

    await expect(input.locator('..')).not.toHaveAttribute('data-reference-field', '')

    await page.getByTestId('btn-check-childless-ref').click()
    await expect(page.getByTestId('childless-ref-result')).toHaveText('Ref is Input: Yes')
  })

  test('DF-DOM-02: folded picker renders Field bezel with synthesized input and trigger', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/FoldedPickerFixture')

    const root = page.getByTestId('folded-fixture-root')
    const bezel = root.locator('div[data-reference-field]')
    await expect(bezel).toBeVisible()

    const input = root.locator('input[data-reference-date-input]')
    const trigger = root.locator('button[data-reference-date-trigger]')
    const picker = page.locator('[data-reference-date-picker]')
    await expect(input).toBeVisible()
    await expect(trigger).toBeVisible()
    await expect(picker).toHaveCount(0)

    await trigger.click()
    await expect(picker).toBeVisible()

    await page.locator('button[data-date="2026-08-25"]').click()
    await expect(picker).toHaveCount(0)
    await expect(page.getByTestId('folded-value-display')).toHaveText('Folded Value: 2026-08-25')
  })

  test('DF-DOM-03: part-resolution merge law for root and explicit props', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/PartResolutionFixture')

    const root = page.getByTestId('merge-fixture-root')
    const input = page.getByTestId('merge-input')

    await expect(input).toHaveAttribute('placeholder', 'Explicit')
    await expect(input).toHaveClass(/root-cls/)
    await expect(input).toHaveClass(/child-cls/)
    await expect(input).toHaveValue('2026-08-15')
    await expect(input).toHaveAttribute('role', 'combobox')

    await expect(root.locator('div[data-reference-field]')).toHaveClass(/root-cls/)

    await input.fill('2026-09-01')
    await expect(page.getByTestId('merge-input-events')).toHaveText('InputEvents: 1')
  })

  test('DF-DOM-04: hidden input serializes only when name is supplied', async ({ mount, page }) => {
    await mount('components/DateField/DateField/ChildlessFixture')

    const root = page.getByTestId('childless-fixture-root')
    const hidden = root.locator('input[type="hidden"]')
    await expect(hidden).toHaveCount(0)

    await page.getByTestId('btn-toggle-childless-name').click()
    await expect(hidden).toHaveCount(1)
    await expect(hidden).toHaveAttribute('name', 'birthday')
    await expect(hidden).toHaveAttribute('value', '2026-08-15')

    await page.getByTestId('btn-set-childless-val-null').click()
    await expect(hidden).toHaveAttribute('value', '')

    await page.getByTestId('btn-set-childless-val-1').click()
    await expect(hidden).toHaveAttribute('value', '2024-04-01')

    await page.getByTestId('btn-toggle-childless-name').click()
    await expect(hidden).toHaveCount(0)
  })

  test('DF-DOM-05: display follows only the controlled ISO prop', async ({ mount, page }) => {
    await mount('components/DateField/DateField/ChildlessFixture')

    const input = page.locator('#bday-childless')
    const display = page.getByTestId('childless-value-display')
    const changelog = page.getByTestId('childless-changelog-count')

    await page.getByTestId('btn-set-childless-val-1').click()
    await expect(display).toHaveText('Childless Value: 2024-04-01')
    await expect(input).toHaveValue('2024-04-01')
    await expect(changelog).toHaveText('Changes: 0')
    await expect(input).not.toHaveAttribute('data-editing', '')

    await page.getByTestId('btn-set-childless-val-null').click()
    await expect(display).toHaveText('Childless Value: None')
    await expect(input).toHaveValue('')
    await expect(changelog).toHaveText('Changes: 0')
    await expect(input).not.toHaveAttribute('data-editing', '')
  })

  test('DF-KEY-05: ArrowUp/Down no-op on null text', async ({ mount, page }) => {
    await mount('components/DateField/DateField/ChildlessFixture')

    await page.getByTestId('btn-set-childless-val-null').click()
    const input = page.locator('#bday-childless')
    await input.focus()
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('ArrowDown')

    await expect(page.getByTestId('childless-value-display')).toHaveText('Childless Value: None')
    await expect(page.getByTestId('childless-changelog-count')).toHaveText('Changes: 0')
    await expect(input).toHaveValue('')
  })

  test('DF-KEY-06: ArrowUp/Down do not step when disabled or read-only', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/ChildlessFixture')

    await page.getByTestId('btn-set-childless-val-1').click()
    const input = page.locator('#bday-childless')
    const display = page.getByTestId('childless-value-display')

    await page.getByTestId('btn-toggle-childless-disabled').click()
    await expect(input).toBeDisabled()
    await page.keyboard.press('ArrowUp')
    await expect(display).toHaveText('Childless Value: 2024-04-01')
    await expect(page.getByTestId('childless-changelog-count')).toHaveText('Changes: 0')

    await page.getByTestId('btn-toggle-childless-disabled').click()
    await page.getByTestId('btn-toggle-childless-readonly').click()
    await input.focus()
    await page.keyboard.press('ArrowUp')
    await expect(display).toHaveText('Childless Value: 2024-04-01')
    await expect(input).toHaveValue('2024-04-01')
    await expect(page.getByTestId('childless-changelog-count')).toHaveText('Changes: 0')
  })

  test('DF-CAL-01: picker upgrades input to the APG combobox contract with deliberate activation', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/CompoundFixture')

    const input = page.getByTestId('date-field-input')
    const picker = page.getByTestId('date-field-picker')

    await expect(input).toHaveAttribute('role', 'combobox')
    await expect(input).toHaveAttribute('aria-haspopup', 'dialog')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(input).toHaveAttribute('aria-autocomplete', 'none')
    await expect(input).toHaveAttribute('aria-controls', /.+/)

    await input.focus()
    await expect(picker).toHaveCount(0)

    await page.keyboard.press('Alt+ArrowDown')
    await expect(picker).toBeVisible()
    await expect(input).toHaveAttribute('aria-expanded', 'true')
    const controlsId = await input.getAttribute('aria-controls')
    expect(controlsId).toBeTruthy()
    await expect(picker).toHaveAttribute('id', controlsId as string)

    await page.keyboard.press('Escape')
    await expect(picker).toHaveCount(0)
    await expect(input).toHaveAttribute('aria-expanded', 'false')

    await input.click()
    await expect(picker).toBeVisible()

    await page.locator('button[data-date="2026-08-25"]').click()
    await expect(picker).toHaveCount(0)
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('date-field-value-display')).toHaveText('Date Value: 2026-08-25')
  })

  test('DF-CAL-03: trigger is an auxiliary tabIndex -1 toggle', async ({ mount, page }) => {
    await mount('components/DateField/DateField/CompoundFixture')

    const input = page.getByTestId('date-field-input')
    const trigger = page.getByTestId('date-field-trigger')
    const picker = page.getByTestId('date-field-picker')

    await expect(trigger).toHaveAttribute('tabindex', '-1')
    await expect(trigger).toHaveAttribute('type', 'button')

    await trigger.click()
    await expect(picker).toBeVisible()
    await expect(input).toBeFocused()

    await trigger.click()
    await expect(picker).toHaveCount(0)
    await expect(input).toBeFocused()
  })

  test('DF-FRM-01: submit sends canonical ISO, not display text', async ({ mount, page }) => {
    await mount('components/DateField/DateField/FormFixture')

    await page.getByTestId('form-submit-btn').click()
    await expect(page.getByTestId('form-submitted-payload')).toContainText('"birthday":"2024-02-01"')
  })

  test('DF-FRM-02: submit sends empty value for controlled null', async ({ mount, page }) => {
    await mount('components/DateField/DateField/FormFixture')

    await page.getByTestId('btn-clear-form-value').click()
    await page.getByTestId('form-submit-btn').click()
    await expect(page.getByTestId('form-submitted-payload')).toContainText('"birthday":""')
  })

  test('DF-FRM-04: required empty field reports platform valueMissing on both hosts', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/RequiredFixture')

    const childless = page.getByTestId('req-childless')
    const compound = page.getByTestId('req-compound-input')

    await expect(childless).toHaveAttribute('required', '')
    await expect(compound).toHaveAttribute('required', '')

    expect(await childless.evaluate((el) => (el as HTMLInputElement).validity.valueMissing)).toBe(
      true
    )
    expect(await compound.evaluate((el) => (el as HTMLInputElement).validity.valueMissing)).toBe(
      true
    )

    await page.getByTestId('btn-set-req-childless').click()
    await page.getByTestId('btn-set-req-compound').click()

    expect(await childless.evaluate((el) => (el as HTMLInputElement).validity.valueMissing)).toBe(
      false
    )
    expect(await compound.evaluate((el) => (el as HTMLInputElement).validity.valueMissing)).toBe(
      false
    )
    expect(await childless.evaluate((el) => (el as HTMLInputElement).validity.valid)).toBe(true)
    expect(await compound.evaluate((el) => (el as HTMLInputElement).validity.valid)).toBe(true)
  })

  test('DF-COMP-02: birthday serializes through htmlFor labeling and canonical form data', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/FormFixture')

    await page.getByText('Birthday Label').click()
    await expect(page.getByTestId('form-datefield-input')).toBeFocused()

    await page.getByTestId('form-submit-btn').click()
    await expect(page.getByTestId('form-submitted-payload')).toContainText('"birthday":"2024-02-01"')
  })

  test('DF-ENV-03: onChange never passes a Date instance', async ({ mount, page }) => {
    await mount('components/DateField/DateField/ChildlessFixture')

    const input = page.locator('#bday-childless')
    await input.fill('2024-05-15')
    await expect(page.getByTestId('childless-changelog-last')).toHaveText('Last: "2024-05-15"')
    await expect(page.getByTestId('childless-changelog-type')).toHaveText('LastType: string')

    await input.fill('')
    await expect(page.getByTestId('childless-changelog-type')).toHaveText('LastType: string')
  })
})
