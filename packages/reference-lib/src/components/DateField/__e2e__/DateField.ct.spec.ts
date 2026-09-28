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

    await expect(input).toHaveValue('8/15/2026')
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
    await expect(input).toHaveValue('8/25/2026')
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
    await expect(input).toHaveValue('8/15/2026')
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
    await expect(input).toHaveValue('4/1/2024')
    await expect(changelog).toHaveText('Changes: 0')
    await expect(input).not.toHaveAttribute('data-editing', 'true')

    await page.getByTestId('btn-set-childless-val-null').click()
    await expect(display).toHaveText('Childless Value: None')
    await expect(input).toHaveValue('')
    await expect(changelog).toHaveText('Changes: 0')
    await expect(input).not.toHaveAttribute('data-editing', 'true')
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
    await expect(input).toHaveValue('4/1/2024')
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

  test('DF-BND-02: programmatic out-of-range value displays with managed invalid', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/ConstrainedFixture')

    const input = page.getByTestId('constrained-input')

    // In-range value: display only, no managed invalid.
    await expect(input).toHaveValue('8/15/2026')
    await expect(input).not.toHaveAttribute('aria-invalid', 'true')
    await expect(input).not.toHaveAttribute('data-invalid', 'true')

    // Out-of-range programmatic value still displays, with managed invalid.
    await page.getByTestId('btn-set-constrained-early').click()
    await expect(input).toHaveValue('8/1/2026')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveAttribute('data-invalid', 'true')

    // Unavailable-marked value is invalid the same way.
    await page.getByTestId('btn-set-constrained-unavail').click()
    await expect(input).toHaveValue('8/12/2026')
    await expect(input).toHaveAttribute('aria-invalid', 'true')

    // Back in range clears managed invalid.
    await page.getByTestId('btn-set-constrained-mid').click()
    await expect(input).toHaveValue('8/15/2026')
    await expect(input).not.toHaveAttribute('aria-invalid', 'true')
    await expect(input).not.toHaveAttribute('data-invalid', 'true')
  })

  test('constrained picker selection outside bounds or unavailable is rejected without commit (FEATURES #3)', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/ConstrainedFixture')

    const input = page.getByTestId('constrained-input')
    const trigger = page.getByTestId('constrained-trigger')
    const picker = page.getByTestId('constrained-picker')
    const display = page.getByTestId('constrained-value-display')
    const changes = page.getByTestId('constrained-changes')

    await trigger.click()
    await expect(picker).toBeVisible()

    // Below min: disabled-unclickable (Calendar #6) — no commit, no dismiss.
    await expect(page.locator('button[data-date="2026-08-05"]')).toBeDisabled()
    await page.locator('button[data-date="2026-08-05"]').click({ force: true })
    await expect(display).toHaveText('Value: 2026-08-15')
    await expect(changes).toHaveText('Changes: 0')
    await expect(input).toHaveValue('8/15/2026')
    await expect(picker).toBeVisible()

    // Above max: disabled-unclickable the same way.
    await expect(page.locator('button[data-date="2026-08-25"]')).toBeDisabled()
    await page.locator('button[data-date="2026-08-25"]').click({ force: true })
    await expect(display).toHaveText('Value: 2026-08-15')
    await expect(changes).toHaveText('Changes: 0')
    await expect(picker).toBeVisible()

    // Marked unavailable: day stays enabled (context isDateUnavailable reaches
    // Calendar only via PATCHES #4, still blocked) — DateField-side rejection
    // refuses the commit without dismiss.
    await page.locator('button[data-date="2026-08-12"]').click()
    await expect(display).toHaveText('Value: 2026-08-15')
    await expect(changes).toHaveText('Changes: 0')
    await expect(picker).toBeVisible()

    // In-range available date commits and dismisses.
    await page.locator('button[data-date="2026-08-18"]').click()
    await expect(display).toHaveText('Value: 2026-08-18')
    await expect(changes).toHaveText('Changes: 1')
    await expect(input).toHaveValue('8/18/2026')
    await expect(picker).toHaveCount(0)
  })

  test('click-while-open positions caret without toggling (FEATURES #4b)', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/CompoundFixture')

    const input = page.getByTestId('date-field-input')
    const picker = page.getByTestId('date-field-picker')

    // First click opens.
    await input.click()
    await expect(picker).toBeVisible()

    // Click-while-open near the left edge positions the caret there and
    // keeps the picker open.
    const box = await input.boundingBox()
    expect(box).toBeTruthy()
    await input.click({ position: { x: 8, y: Math.floor(box!.height / 2) } })
    await expect(picker).toBeVisible()
    await expect(input).toBeFocused()
    const leftCaret = await input.evaluate((el) => (el as HTMLInputElement).selectionStart)
    expect(leftCaret).toBeLessThanOrEqual(2)

    // Click-while-open near the right edge moves the caret there.
    await input.click({
      position: { x: Math.floor(box!.width - 8), y: Math.floor(box!.height / 2) },
    })
    await expect(picker).toBeVisible()
    await expect(input).toBeFocused()
    const rightCaret = await input.evaluate((el) => (el as HTMLInputElement).selectionStart)
    expect(rightCaret).toBeGreaterThanOrEqual(8)
  })

  test('DF-ENV-03: onChange never passes a Date instance', async ({ mount, page }) => {
    await mount('components/DateField/DateField/ChildlessFixture')

    const input = page.locator('#bday-childless')
    await input.fill('2024-05-15')
    await expect(page.getByTestId('childless-changelog-last')).toHaveText('Last: "2024-05-15"')
    await expect(page.getByTestId('childless-changelog-type')).toHaveText('LastType: string')

    // Clearing requests null (never a Date, never raw text).
    await input.fill('')
    await expect(page.getByTestId('childless-changelog-last')).toHaveText('Last: null')
    await expect(page.getByTestId('childless-changelog-type')).toHaveText('LastType: object')
  })

  test('DF-ENV-01: DateField associates form and events inside an open ShadowRoot', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/ShadowFormFixture')

    await expect(page.getByTestId('shadow-form-host')).toBeVisible()

    // Quarantine parity: the shadow tree owns the field's inputs.
    const shadowInputCount = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="shadow-form-host"]')
      return host?.shadowRoot ? host.shadowRoot.querySelectorAll('input').length : 0
    })
    expect(shadowInputCount).toBeGreaterThan(0)

    // Scoped events: typing inside the shadow tree publishes onChange.
    const input = page.getByTestId('shadow-form-input')
    await expect(input).toBeVisible()
    await input.fill('2024-05-15')
    await expect(page.getByTestId('shadow-form-changes')).toHaveText('Changes: 1')
    await expect(page.getByTestId('shadow-form-value')).toHaveText('Value: 2024-05-15')

    // Same-tree form work: submit serializes canonical ISO through the
    // shadow-hosted hidden input.
    await page.getByTestId('shadow-form-submit').click()
    await expect(page.getByTestId('shadow-form-payload')).toContainText('"birthday":"2024-05-15"')
  })

  test('DF-CMT-07: composition suspends parsing and a stale end after value replace is ignored', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/ChildlessFixture')

    const input = page.locator('#bday-childless')
    const changes = page.getByTestId('childless-changelog-count')
    await expect(input).toHaveValue('8/15/2026')

    await input.focus()
    await input.dispatchEvent('compositionstart')
    // Typing during composition joins the buffer but publishes nothing.
    await input.fill('9/1/2026')
    await expect(input).toHaveValue('9/1/2026')
    await expect(changes).toHaveText('Changes: 0')

    // Programmatic replace during composition invalidates the session
    // (blur-commit is suspended too, so the click-through blur is silent).
    await page.getByTestId('btn-set-childless-val-1').click()
    await expect(input).toHaveValue('4/1/2024')
    await expect(changes).toHaveText('Changes: 0')

    // Stale compositionend fallout is ignored: no bogus request.
    await input.dispatchEvent('compositionend')
    await expect(page.getByTestId('childless-value-display')).toHaveText(
      'Childless Value: 2024-04-01'
    )
    await expect(changes).toHaveText('Changes: 0')
  })

  test('DF-COMP-04: DateField picker composes inside an open ShadowRoot', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/ShadowPickerFixture')

    await expect(page.getByTestId('shadow-picker-host')).toBeVisible()

    const input = page.locator('[data-reference-date-input]')
    const trigger = page.locator('button[data-reference-date-trigger]')
    const picker = page.getByTestId('shadow-picker')

    await expect(input).toBeVisible()
    await expect(trigger).toBeVisible()

    // Deliberate activation holds in shadow: focus alone does not open.
    await input.focus()
    await expect(picker).toHaveCount(0)

    // Keyboard open, then the picker portals into the owning shadow root —
    // the Overlay automatic destination rule — never document.body.
    await page.keyboard.press('Alt+ArrowDown')
    await expect(picker).toBeVisible()
    const dest = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="shadow-picker-host"]') as HTMLElement
      return {
        inShadow: Boolean(host.shadowRoot?.querySelector('[data-testid="shadow-picker"]')),
        inBody: Boolean(document.body.querySelector(':scope > [data-testid="shadow-picker"]')),
      }
    })
    expect(dest.inShadow).toBe(true)
    expect(dest.inBody).toBe(false)

    // Keyboard dismiss.
    await page.keyboard.press('Escape')
    await expect(picker).toHaveCount(0)

    // Trigger toggle opens; day commit bubbles through the shadow boundary
    // to light-DOM state and dismisses.
    await trigger.click()
    await expect(picker).toBeVisible()
    await page.locator('button[data-date="2026-08-25"]').click()
    await expect(picker).toHaveCount(0)
    await expect(page.getByTestId('shadow-picker-value')).toHaveText('Value: 2026-08-25')
    await expect(input).toHaveValue('8/25/2026')
  })
})

test.describe('DateField engine (PATCHES #1: B-15/B-16/B-24)', () => {
  test('DF-FMT-01/DF-EDT-03/DF-EDT-07: en-GB displays day/month/year and a complete valid edit requests once', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/EngineFixture')

    const input = page.getByTestId('engine-input')
    const changes = page.getByTestId('engine-changes')
    const last = page.getByTestId('engine-last')

    await expect(input).toHaveValue('01/02/2024')

    // Omitted leading zeros are fine until commit: 3/4/2024 is 3 April.
    await input.fill('3/4/2024')
    await expect(changes).toHaveText('Changes: 1')
    await expect(last).toHaveText('Last: "2024-04-03"')

    // Keystroke typing publishes exactly once, on the completing keystroke.
    await page.getByTestId('btn-engine-set-null').click()
    await expect(input).toHaveValue('')
    await input.pressSequentially('15/06/2024')
    await expect(changes).toHaveText('Changes: 2')
    await expect(last).toHaveText('Last: "2024-06-15"')
  })

  test('DF-FMT-02/DF-EDT-09: en-US parses the same keystrokes as month/day/year — never guessed', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/EngineFixture')

    const input = page.getByTestId('engine-input')
    const changes = page.getByTestId('engine-changes')
    const last = page.getByTestId('engine-last')

    await page.getByTestId('btn-engine-locale-us').click()
    await expect(input).toHaveValue('2/1/2024')

    await page.getByTestId('btn-engine-set-null').click()
    await input.fill('01/02/2024')
    await expect(last).toHaveText('Last: "2024-01-02"')

    await page.getByTestId('btn-engine-set-null').click()
    await input.fill('06/15/2024')
    await expect(changes).toHaveText('Changes: 2')
    await expect(last).toHaveText('Last: "2024-06-15"')
  })

  test('DF-EDT-09: 01/02/2024 is 1 February under en-GB', async ({ mount, page }) => {
    await mount('components/DateField/DateField/EngineFixture')

    const input = page.getByTestId('engine-input')
    await page.getByTestId('btn-engine-set-null').click()
    await input.fill('01/02/2024')
    await expect(page.getByTestId('engine-last')).toHaveText('Last: "2024-02-01"')
  })

  test('DF-FMT-03/DF-COMP-01: de-DE honors dot separators for display, typing, and picker commit', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/EngineFixture')

    const input = page.getByTestId('engine-input')
    const picker = page.getByTestId('engine-picker')

    await page.getByTestId('btn-engine-locale-de').click()
    await expect(input).toHaveValue('1.2.2024')

    await input.fill('15.6.2024')
    await expect(page.getByTestId('engine-last')).toHaveText('Last: "2024-06-15"')

    await input.focus()
    await page.keyboard.press('Alt+ArrowDown')
    await expect(picker).toBeVisible()
    await page.locator('button[data-date="2024-06-20"]').click()
    await expect(picker).toHaveCount(0)
    await expect(input).toHaveValue('20.6.2024')
    await expect(page.getByTestId('engine-value-display')).toHaveText(
      'Engine Value: 2024-06-20'
    )
  })

  test('DF-FMT-03: sv-SE round-trips its ISO-like year-first grammar', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/EngineFixture')

    const input = page.getByTestId('engine-input')
    await page.getByTestId('btn-engine-locale-se').click()
    await expect(input).toHaveValue('2024-02-01')

    await input.fill('2024-06-15')
    await expect(page.getByTestId('engine-last')).toHaveText('Last: "2024-06-15"')
  })

  test('DF-FMT-04/DF-COMP-03: ja-JP keeps numeric literals in display and accepts omitted literals while typing', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/EngineFixture')

    const input = page.getByTestId('engine-input')
    const picker = page.getByTestId('engine-picker')

    await page.getByTestId('btn-engine-locale-jp').click()
    await expect(input).toHaveValue('2024年2月1日')

    await input.fill('2024/6/15')
    await expect(page.getByTestId('engine-last')).toHaveText('Last: "2024-06-15"')

    await input.focus()
    await page.keyboard.press('Alt+ArrowDown')
    await expect(picker).toBeVisible()
    await page.locator('button[data-date="2024-06-20"]').click()
    await expect(picker).toHaveCount(0)
    await expect(input).toHaveValue('2024年6月20日')
  })

  test('DF-FMT-05: ar-EG accepts ASCII mixed with one locale digit set', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/EngineFixture')

    const input = page.getByTestId('engine-input')
    await page.getByTestId('btn-engine-locale-eg').click()
    // Display uses the locale digit set, never raw ISO.
    await expect(input).not.toHaveValue('2024-02-01')
    await expect(input).not.toHaveValue('')

    await input.fill('15/٦/٢٠٢٤')
    await expect(page.getByTestId('engine-last')).toHaveText('Last: "2024-06-15"')
  })

  test('DF-EDT-01: partial text stays visible and silent with data-editing', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/EngineFixture')

    const input = page.getByTestId('engine-input')
    const changes = page.getByTestId('engine-changes')

    await input.fill('3/')
    await expect(input).toHaveValue('3/')
    await expect(input).toHaveAttribute('data-editing', 'true')
    await expect(changes).toHaveText('Changes: 0')

    await input.fill('31/0')
    await expect(input).toHaveValue('31/0')
    await expect(input).toHaveAttribute('data-editing', 'true')
    await expect(changes).toHaveText('Changes: 0')
  })

  test('DF-EDT-02: clearing requests null once and never re-requests it', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/EngineFixture')

    const input = page.getByTestId('engine-input')
    const changes = page.getByTestId('engine-changes')

    await input.fill('')
    await expect(changes).toHaveText('Changes: 1')
    await expect(page.getByTestId('engine-last')).toHaveText('Last: null')

    // Blur-commit after the live null does not re-request.
    await page.getByTestId('engine-locale').click()
    await expect(changes).toHaveText('Changes: 1')
    await expect(input).toHaveValue('')
  })

  test('DF-EDT-04/DF-EDT-05/DF-EDT-06: impossible dates and two-digit years never publish; commit reverts with managed invalid', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/EngineFixture')

    const input = page.getByTestId('engine-input')
    const changes = page.getByTestId('engine-changes')

    // Impossible Gregorian dates (no JS Date overflow): silent live.
    await input.fill('31/04/2024')
    await expect(changes).toHaveText('Changes: 0')
    await input.fill('2024-04-31')
    await expect(changes).toHaveText('Changes: 0')
    await input.fill('29/02/2023')
    await expect(changes).toHaveText('Changes: 0')

    // Commit reverts to formatted controlled state with managed invalid.
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('01/02/2024')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveAttribute('data-invalid', 'true')

    // 29 February only on leap years.
    await input.fill('29/02/2024')
    await expect(changes).toHaveText('Changes: 1')
    await expect(page.getByTestId('engine-last')).toHaveText('Last: "2024-02-29"')
    await page.getByTestId('btn-engine-set-null').click()
    await input.fill('29/02/1900')
    await expect(changes).toHaveText('Changes: 1')

    // Two-digit years are incomplete: commit reverts, stays invalid.
    await input.fill('31/12/24')
    await expect(changes).toHaveText('Changes: 1')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  test('DF-EDT-08: complete canonical ISO is interchange in any locale', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/EngineFixture')

    const input = page.getByTestId('engine-input')
    await input.fill('2024-12-31')
    await expect(page.getByTestId('engine-last')).toHaveText('Last: "2024-12-31"')

    await page.getByTestId('btn-engine-locale-us').click()
    await input.fill('2025-01-30')
    await expect(page.getByTestId('engine-last')).toHaveText('Last: "2025-01-30"')
  })

  test('B-15: garbage, out-of-shape, and impossible text never publishes', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/EngineFixture')

    const input = page.getByTestId('engine-input')
    const changes = page.getByTestId('engine-changes')

    for (const garbage of ['garbage!!', '2026-13-99', '2026-02-30', 'next Tuesday', '13/13/2026']) {
      await input.fill(garbage)
      await expect(changes).toHaveText('Changes: 0')
    }
    // The buffer shows every keystroke; the controlled value never moves.
    await expect(input).toHaveValue('13/13/2026')
    await expect(page.getByTestId('engine-value-display')).toHaveText(
      'Engine Value: 2024-02-01'
    )
  })

  test('DF-CMT-01: blur and Enter commit without duplicate requests', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/EngineFixture')

    const input = page.getByTestId('engine-input')
    const changes = page.getByTestId('engine-changes')

    await input.fill('15/06/2024')
    await expect(changes).toHaveText('Changes: 1')

    // Enter after an accepted live echo: no duplicate, session ends.
    await page.keyboard.press('Enter')
    await expect(changes).toHaveText('Changes: 1')
    await expect(input).toHaveValue('15/06/2024')
    await expect(input).not.toHaveAttribute('data-editing', 'true')

    // Blur after another live echo: same — formatted text remains.
    await input.fill('16/06/2024')
    await expect(changes).toHaveText('Changes: 2')
    await page.getByTestId('engine-locale').click()
    await expect(changes).toHaveText('Changes: 2')
    await expect(input).toHaveValue('16/06/2024')
    await expect(input).not.toHaveAttribute('data-editing', 'true')
  })

  test('DF-CMT-02: blur from incomplete or rejected text reverts with managed invalid', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/EngineFixture')

    const input = page.getByTestId('engine-input')
    await input.fill('3/')
    await page.getByTestId('engine-locale').click()
    await expect(input).toHaveValue('01/02/2024')
    await expect(input).toHaveAttribute('aria-invalid', 'true')

    await input.fill('31/04/2024')
    await page.getByTestId('engine-locale').click()
    await expect(input).toHaveValue('01/02/2024')
    await expect(input).toHaveAttribute('data-invalid', 'true')
  })

  test('DF-CMT-03: preventDefault on blur keeps the dirty buffer and refocus resumes the session', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/BlurVetoFixture')

    const input = page.getByTestId('veto-input')
    await expect(input).toHaveValue('01/04/2024')

    await input.fill('13/')
    // Span click blurs; the veto cancels the commit boundary.
    await page.getByTestId('veto-value-display').click()
    await expect(input).toHaveValue('13/')
    await expect(input).toHaveAttribute('data-editing', 'true')
    await expect(input).not.toHaveAttribute('aria-invalid', 'true')

    // Refocus resumes the same session: completing the text publishes.
    await input.focus()
    await input.fill('13/06/2024')
    await expect(page.getByTestId('veto-changes')).toHaveText('Changes: 1')
    await expect(page.getByTestId('veto-value-display')).toHaveText('Veto Value: 2024-06-13')
  })

  test('DF-CMT-04: an accepted live echo preserves the buffer', async ({ mount, page }) => {
    await mount('components/DateField/DateField/EngineFixture')

    const input = page.getByTestId('engine-input')
    await input.fill('15/06/2024')
    await expect(page.getByTestId('engine-value-display')).toHaveText(
      'Engine Value: 2024-06-15'
    )
    // Parent accepted the live request: buffer and session preserved.
    await expect(input).toHaveValue('15/06/2024')
    await expect(input).toHaveAttribute('data-editing', 'true')
  })

  test('DF-CMT-05: a parent value replace reformats, ends the session, and stays silent', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/EngineFixture')

    const input = page.getByTestId('engine-input')
    const changes = page.getByTestId('engine-changes')

    await input.fill('3/')
    await expect(input).toHaveAttribute('data-editing', 'true')

    await page.getByTestId('btn-engine-set-jun15').click()
    await expect(input).toHaveValue('15/06/2024')
    await expect(input).not.toHaveAttribute('data-editing', 'true')
    await expect(changes).toHaveText('Changes: 0')
  })

  test('DF-CMT-06: a locale change reorders the formatted value without publishing', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/EngineFixture')

    const input = page.getByTestId('engine-input')
    await expect(input).toHaveValue('01/02/2024')

    await page.getByTestId('btn-engine-locale-us').click()
    await expect(input).toHaveValue('2/1/2024')
    await expect(page.getByTestId('engine-changes')).toHaveText('Changes: 0')

    await page.getByTestId('btn-engine-locale-gb').click()
    await expect(input).toHaveValue('01/02/2024')
  })

  test('DF-BND-01: typed out-of-range dates never publish; commit reverts without clamping', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/ConstrainedFixture')

    const input = page.getByTestId('constrained-input')
    const changes = page.getByTestId('constrained-changes')
    await expect(input).toHaveValue('8/15/2026')

    // Below min: silent live, Enter-commit reverts with managed invalid.
    await input.fill('8/5/2026')
    await expect(changes).toHaveText('Changes: 0')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('8/15/2026')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(changes).toHaveText('Changes: 0')

    // Above max: silent live, blur-commit reverts the same way.
    await input.fill('8/25/2026')
    await expect(changes).toHaveText('Changes: 0')
    await page.getByTestId('constrained-value-display').click()
    await expect(input).toHaveValue('8/15/2026')
    await expect(input).toHaveAttribute('data-invalid', 'true')
    await expect(changes).toHaveText('Changes: 0')
  })

  test('DF-BND-03: isDateUnavailable rejects typed dates exactly like min/max', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/ConstrainedFixture')

    const input = page.getByTestId('constrained-input')
    const changes = page.getByTestId('constrained-changes')

    await input.fill('8/12/2026')
    await expect(changes).toHaveText('Changes: 0')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('8/15/2026')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(changes).toHaveText('Changes: 0')

    // An in-constraints date still publishes from the same session shape.
    await input.fill('8/18/2026')
    await expect(changes).toHaveText('Changes: 1')
  })

  test('DF-CAL-02: typing a complete date moves the open grid without dismissing', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/CompoundFixture')

    const input = page.getByTestId('date-field-input')
    const picker = page.getByTestId('date-field-picker')

    await input.focus()
    await page.keyboard.press('Alt+ArrowDown')
    await expect(picker).toBeVisible()
    // The folded picker header presents Month/Year drill-down buttons.
    await expect(page.locator('[data-reference-calendar-month]')).toHaveText('August')

    await input.fill('9/10/2026')
    await expect(page.getByTestId('date-field-value-display')).toHaveText(
      'Date Value: 2026-09-10'
    )
    await expect(page.locator('[data-reference-calendar-month]')).toHaveText('September')
    await expect(page.locator('button[data-date="2026-09-10"]')).toBeVisible()
    await expect(picker).toBeVisible()
  })
})

test.describe('DateField stepping (PATCHES #2)', () => {
  test('DF-KEY-01: ArrowUp/Down step the caret day/month/year segment and commit one ISO', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/EngineFixture')

    const input = page.getByTestId('engine-input')
    const display = page.getByTestId('engine-value-display')
    const changes = page.getByTestId('engine-changes')
    const last = page.getByTestId('engine-last')

    await expect(input).toHaveValue('01/02/2024')
    await input.focus()

    // Caret in the day segment steps the day and commits.
    await input.evaluate((el) => (el as HTMLInputElement).setSelectionRange(1, 1))
    await page.keyboard.press('ArrowUp')
    await expect(last).toHaveText('Last: "2024-02-02"')
    await expect(display).toHaveText('Engine Value: 2024-02-02')
    await expect(input).toHaveValue('02/02/2024')
    await expect(changes).toHaveText('Changes: 1')
    await expect(input).not.toHaveAttribute('data-editing', 'true')

    // Caret in the month segment steps the month.
    await input.evaluate((el) => (el as HTMLInputElement).setSelectionRange(4, 4))
    await page.keyboard.press('ArrowDown')
    await expect(last).toHaveText('Last: "2024-01-02"')
    await expect(input).toHaveValue('02/01/2024')
    await expect(changes).toHaveText('Changes: 2')

    // Caret in the year segment steps the year.
    await input.evaluate((el) => (el as HTMLInputElement).setSelectionRange(8, 8))
    await page.keyboard.press('ArrowUp')
    await expect(last).toHaveText('Last: "2025-01-02"')
    await expect(input).toHaveValue('02/01/2025')
    await expect(changes).toHaveText('Changes: 3')
  })

  test('DF-KEY-04: Shift steps 10x of the caret segment', async ({ mount, page }) => {
    await mount('components/DateField/DateField/EngineFixture')

    const input = page.getByTestId('engine-input')
    const last = page.getByTestId('engine-last')

    await expect(input).toHaveValue('01/02/2024')
    await input.focus()

    await input.evaluate((el) => (el as HTMLInputElement).setSelectionRange(1, 1))
    await page.keyboard.press('Shift+ArrowUp')
    await expect(last).toHaveText('Last: "2024-02-11"')
    await expect(input).toHaveValue('11/02/2024')

    await input.evaluate((el) => (el as HTMLInputElement).setSelectionRange(4, 4))
    await page.keyboard.press('Shift+ArrowUp')
    await expect(last).toHaveText('Last: "2024-12-11"')
    await expect(input).toHaveValue('11/12/2024')

    await input.evaluate((el) => (el as HTMLInputElement).setSelectionRange(8, 8))
    await page.keyboard.press('Shift+ArrowDown')
    await expect(last).toHaveText('Last: "2014-12-11"')
    await expect(input).toHaveValue('11/12/2014')
  })

  test('DF-KEY-07: a caret on a separator steps the nearest numeric segment', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/EngineFixture')

    const input = page.getByTestId('engine-input')
    const last = page.getByTestId('engine-last')

    await expect(input).toHaveValue('01/02/2024')
    await input.focus()

    // Caret on the first '/' steps the preceding day segment.
    await input.evaluate((el) => (el as HTMLInputElement).setSelectionRange(2, 2))
    await page.keyboard.press('ArrowUp')
    await expect(last).toHaveText('Last: "2024-02-02"')
    await expect(input).toHaveValue('02/02/2024')

    // Caret on the second '/' steps the preceding month segment.
    await input.evaluate((el) => (el as HTMLInputElement).setSelectionRange(5, 5))
    await page.keyboard.press('ArrowUp')
    await expect(last).toHaveText('Last: "2024-03-02"')
    await expect(input).toHaveValue('02/03/2024')
  })
})

test.describe('DateField submit/reset (PATCHES #5)', () => {
  test('DF-FRM-03: requestSubmit blocks on a failed commit boundary until resolution', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/SubmitResetFixture')

    const input = page.getByTestId('sr-input')
    const submitted = page.getByTestId('sr-submitted')
    const changes = page.getByTestId('sr-changes')
    const hidden = page.locator('#sr-fixture-root input[type="hidden"], [data-testid="sr-fixture-root"] input[type="hidden"]')

    await expect(input).toHaveValue('01/02/2024')

    // Blur from incomplete text fails the commit boundary.
    await input.fill('3/')
    await page.keyboard.press('Tab')
    await expect(input).toHaveValue('01/02/2024')
    await expect(input).toHaveAttribute('aria-invalid', 'true')

    // Submit attempts stay blocked without consuming the boundary.
    await page.getByTestId('btn-sr-submit').click()
    await expect(submitted).toHaveText('Submitted: blocked')
    await page.getByTestId('btn-sr-submit').click()
    await expect(submitted).toHaveText('Submitted: blocked')
    await expect(changes).toHaveText('Changes: 0')
    await expect(hidden).toHaveAttribute('value', '2024-02-01')

    // A subsequent valid edit resolves: commit, then an explicit retry sends.
    await input.fill('15/06/2024')
    await expect(changes).toHaveText('Changes: 1')
    await page.getByTestId('btn-sr-submit').click()
    await expect(submitted).toHaveText('Submitted: sent')
    await expect(hidden).toHaveAttribute('value', '2024-06-15')
  })

  test('DF-FRM-05: unprevented reset reformats without changing controlled ISO', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/SubmitResetFixture')

    const input = page.getByTestId('sr-input')
    const display = page.getByTestId('sr-value-display')
    const changes = page.getByTestId('sr-changes')
    const hidden = page.locator('[data-testid="sr-fixture-root"] input[type="hidden"]')

    await input.fill('3/')
    await expect(input).toHaveAttribute('data-editing', 'true')

    // Reset while focused: no blur, no callback, controlled value kept.
    await page.evaluate(() => {
      (document.querySelector('[data-testid="sr-fixture-root"] form') as HTMLFormElement | null)?.reset()
    })
    await expect(input).toHaveValue('01/02/2024')
    await expect(display).toHaveText('Value: 2024-02-01')
    await expect(changes).toHaveText('Changes: 0')
    await expect(input).not.toHaveAttribute('data-editing', 'true')
    await expect(input).not.toHaveAttribute('aria-invalid', 'true')
    await expect(input).toBeFocused()
    expect(await input.evaluate((el) => (el as HTMLInputElement).selectionStart)).toBe(10)
    await expect(hidden).toHaveAttribute('value', '2024-02-01')

    // A vetoed reset leaves the focused dirty session exactly intact.
    await input.fill('7/')
    await expect(input).toHaveAttribute('data-editing', 'true')
    await page.evaluate(() => {
      ;(document.querySelector('[data-testid="btn-sr-arm-veto"]') as HTMLButtonElement)?.click()
      ;(document.querySelector('[data-testid="sr-fixture-root"] form') as HTMLFormElement | null)?.reset()
    })
    await expect(input).toHaveValue('7/')
    await expect(input).toHaveAttribute('data-editing', 'true')
    await expect(changes).toHaveText('Changes: 0')
    await expect(display).toHaveText('Value: 2024-02-01')
  })
})

test.describe('DateField.Range (FEATURES #2)', () => {
  test('DF-RANGE-01: Range manages two endpoint sessions over one range value', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/RangeFixture')

    const root = page.getByTestId('range-fixture-root')
    const bezel = root.locator('div[data-reference-field]')
    const start = root.locator('input[data-reference-date-endpoint="start"]')
    const end = root.locator('input[data-reference-date-endpoint="end"]')

    // One bezel hosts both endpoint inputs.
    await expect(bezel).toBeVisible()
    await expect(start).toHaveValue('10/04/2024')
    await expect(end).toHaveValue('15/04/2024')
    await expect(bezel).toHaveAttribute('data-can-apply', 'true')

    // Typing the start publishes a range draft; the end is untouched.
    await start.fill('12/04/2024')
    await expect(page.getByTestId('range-last')).toHaveText(
      'Last: {"start":"2024-04-12","end":"2024-04-15"}'
    )
    await expect(page.getByTestId('range-changes')).toHaveText('Changes: 1')
    await expect(end).toHaveValue('15/04/2024')
    await expect(page.getByTestId('range-value-display')).toHaveText(
      'Range Value: 2024-04-12..2024-04-15'
    )
  })

  test('DF-RANGE-02: end-only drafts hold without reaching onChange or Calendar', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/RangeFixture')

    const root = page.getByTestId('range-fixture-root')
    const start = root.locator('input[data-reference-date-endpoint="start"]')
    const end = root.locator('input[data-reference-date-endpoint="end"]')
    const picker = page.getByTestId('range-picker')

    await page.getByTestId('btn-range-set-null').click()
    await expect(start).toHaveValue('')
    await expect(end).toHaveValue('')

    // Type the end first: the draft holds it, nothing publishes.
    await end.click()
    await expect(picker).toBeVisible()
    await end.fill('15/04/2024')
    await expect(end).toHaveValue('15/04/2024')
    await expect(start).toHaveValue('')
    await expect(page.getByTestId('range-changes')).toHaveText('Changes: 0')
    await expect(page.getByTestId('range-value-display')).toHaveText('Range Value: None')

    // The Calendar receives a null value: the grid renders (pane follows
    // the typed end) with no selected cell and no anchor.
    await expect(picker.locator('button[data-date="2024-04-15"]')).toBeVisible()
    await expect(picker.locator('[aria-selected="true"]')).toHaveCount(0)
    await expect(picker.locator('[data-range-start]')).toHaveCount(0)
  })

  test('DF-RANGE-03: the Calendar pane follows the focused endpoint', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/RangeFixture')

    const root = page.getByTestId('range-fixture-root')
    const start = root.locator('input[data-reference-date-endpoint="start"]')
    const end = root.locator('input[data-reference-date-endpoint="end"]')
    const monthName = page.locator('[data-reference-calendar-month]')

    await page.getByTestId('btn-range-set-split').click()

    await start.click()
    await expect(page.getByTestId('range-picker')).toBeVisible()
    await expect(monthName).toHaveText('April')

    await end.click()
    await expect(monthName).toHaveText('June')

    await start.click()
    await expect(monthName).toHaveText('April')
  })

  test('DF-RANGE-04: typed inversion is preserved until Calendar completion normalizes', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/RangeFixture')

    const root = page.getByTestId('range-fixture-root')
    const bezel = root.locator('div[data-reference-field]')
    const start = root.locator('input[data-reference-date-endpoint="start"]')
    const end = root.locator('input[data-reference-date-endpoint="end"]')
    const picker = page.getByTestId('range-picker')

    await page.getByTestId('btn-range-set-null').click()

    await start.fill('15/04/2024')
    await end.fill('10/04/2024')
    await expect(start).toHaveValue('15/04/2024')
    await expect(end).toHaveValue('10/04/2024')
    await expect(bezel).toHaveAttribute('data-can-apply', 'false')
    await expect(page.getByTestId('range-changes')).toHaveText('Changes: 0')

    // Selecting in the Calendar restarts from the anchor and completes
    // normalized: the anchor clears the inverted end, the second click
    // publishes the chronological range and dismisses.
    await start.click()
    await expect(picker).toBeVisible()
    await page.locator('button[data-date="2024-04-10"]').click()
    await expect(start).toHaveValue('10/04/2024')
    await expect(end).toHaveValue('')
    await expect(page.getByTestId('range-changes')).toHaveText('Changes: 0')
    await expect(picker).toBeVisible()

    await page.locator('button[data-date="2024-04-15"]').click()
    await expect(page.getByTestId('range-last')).toHaveText(
      'Last: {"start":"2024-04-10","end":"2024-04-15"}'
    )
    await expect(page.getByTestId('range-changes')).toHaveText('Changes: 1')
    await expect(picker).toHaveCount(0)
    await expect(start).toHaveValue('10/04/2024')
    await expect(end).toHaveValue('15/04/2024')
  })

  test('DF-RANGE-05: Escape restores the draft; completing the draft publishes', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/RangeFixture')

    const root = page.getByTestId('range-fixture-root')
    const start = root.locator('input[data-reference-date-endpoint="start"]')
    const end = root.locator('input[data-reference-date-endpoint="end"]')
    const picker = page.getByTestId('range-picker')

    await start.click()
    await expect(picker).toBeVisible()

    // A partial draft cancels with no callback and the picker closes.
    await start.fill('1')
    await expect(start).toHaveValue('1')
    await page.keyboard.press('Escape')
    await expect(start).toHaveValue('10/04/2024')
    await expect(end).toHaveValue('15/04/2024')
    await expect(page.getByTestId('range-changes')).toHaveText('Changes: 0')
    await expect(picker).toHaveCount(0)

    // Completing the draft publishes once; commit does not duplicate.
    await start.fill('12/04/2024')
    await expect(page.getByTestId('range-last')).toHaveText(
      'Last: {"start":"2024-04-12","end":"2024-04-15"}'
    )
    await expect(page.getByTestId('range-changes')).toHaveText('Changes: 1')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('range-changes')).toHaveText('Changes: 1')
  })

  test('DF-RANGE-06: Start and End unfold with their own props', async ({ mount, page }) => {
    await mount('components/DateField/DateField/UnfoldedRangeFixture')

    const start = page.getByTestId('ur-start')
    const end = page.getByTestId('ur-end')

    await expect(start).toHaveAttribute('placeholder', 'From')
    await expect(end).toHaveAttribute('placeholder', 'To')
    await expect(end).toHaveAttribute('aria-label', 'To date')
    await expect(start).toHaveAttribute('role', 'combobox')
    await expect(end).toHaveAttribute('role', 'combobox')

    // Both endpoints edit against the one range value.
    await start.fill('12/04/2024')
    await expect(page.getByTestId('ur-last')).toHaveText(
      'Last: {"start":"2024-04-12","end":"2024-06-15"}'
    )
    await end.fill('20/06/2024')
    await expect(page.getByTestId('ur-last')).toHaveText(
      'Last: {"start":"2024-04-12","end":"2024-06-20"}'
    )
  })

  test('DF-COMP-05: unfolded range picker edits, syncs, and transacts end to end', async ({
    mount,
    page,
  }) => {
    await mount('components/DateField/DateField/UnfoldedRangeFixture')

    const start = page.getByTestId('ur-start')
    const end = page.getByTestId('ur-end')
    const trigger = page.getByTestId('ur-trigger')
    const picker = page.getByTestId('ur-picker')
    const monthName = page.locator('[data-reference-calendar-month]')

    // Auxiliary trigger toggles with tabIndex -1 and focuses the input.
    await expect(trigger).toHaveAttribute('tabindex', '-1')
    await expect(trigger).toHaveAttribute('type', 'button')
    await trigger.click()
    await expect(picker).toBeVisible()
    await expect(start).toBeFocused()

    // The folded range picker applies on completion: no Apply button.
    await expect(picker.getByRole('button', { name: 'Apply' })).toHaveCount(0)

    // Active-endpoint pane sync across months.
    await expect(monthName).toHaveText('April')
    await end.click()
    await expect(monthName).toHaveText('June')

    // Cancel restores the committed draft with no callback.
    await end.fill('1')
    await page.keyboard.press('Escape')
    await expect(start).toHaveValue('10/04/2024')
    await expect(end).toHaveValue('15/06/2024')
    await expect(page.getByTestId('ur-changes')).toHaveText('Changes: 0')
    await expect(picker).toHaveCount(0)

    // Completion publishes once and dismisses.
    await start.click()
    await page.locator('button[data-date="2024-04-12"]').click()
    await page.locator('button[data-date="2024-04-20"]').click()
    await expect(page.getByTestId('ur-last')).toHaveText(
      'Last: {"start":"2024-04-12","end":"2024-04-20"}'
    )
    await expect(picker).toHaveCount(0)
  })

  test('DF-COMP-06: unfolding every part preserves managed invariants', async ({
    mount,
    page,
  }) => {
    // Single field: forged value/role lose to managed state, the Calendar
    // alias stays day-bound, selection publishes and dismisses.
    await mount('components/DateField/DateField/SingleUnfoldedFixture')

    const input = page.getByTestId('su-input')
    await expect(input).toHaveValue('10/04/2024')
    await expect(input).toHaveAttribute('role', 'combobox')
    await expect(input).toHaveAttribute('placeholder', 'Explicit')

    await input.click()
    await expect(page.getByTestId('su-picker')).toBeVisible()
    await page.locator('button[data-date="2024-04-15"]').click()
    await expect(page.getByTestId('su-value-display')).toHaveText('Value: 2024-04-15')
    await expect(page.getByTestId('su-changes')).toHaveText('Changes: 1')
    await expect(page.getByTestId('su-picker')).toHaveCount(0)

    // Range: forged Start value/role lose, placeholders land, the alias
    // stays range-bound, completion publishes and dismisses.
    await mount('components/DateField/DateField/UnfoldedRangeFixture')

    const start = page.getByTestId('ur-start')
    await expect(start).toHaveValue('10/04/2024')
    await expect(start).toHaveAttribute('role', 'combobox')
    await expect(start).toHaveAttribute('placeholder', 'From')
    await expect(page.getByTestId('ur-end')).toHaveAttribute('placeholder', 'To')

    await start.click()
    await expect(page.getByTestId('ur-picker')).toBeVisible()
    await page.locator('button[data-date="2024-04-12"]').click()
    await page.locator('button[data-date="2024-04-20"]').click()
    await expect(page.getByTestId('ur-last')).toHaveText(
      'Last: {"start":"2024-04-12","end":"2024-04-20"}'
    )
    await expect(page.getByTestId('ur-picker')).toHaveCount(0)
  })
})
