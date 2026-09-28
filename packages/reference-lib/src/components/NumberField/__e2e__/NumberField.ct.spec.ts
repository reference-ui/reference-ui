import { test, expect, snap } from '../../../../playwright/ct'

test.describe('NumberField CT', () => {
  test('renders textbox, steppers, and increments/decrements via keyboard and buttons', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/StepperFixture')

    const input = page.getByTestId('number-field-input')
    const btnInc = page.getByTestId('btn-increment')
    const btnDec = page.getByTestId('btn-decrement')
    const display = page.getByTestId('number-field-value-display')

    const root = page.getByTestId('number-field-fixture-root')
    const field = page.getByTestId('number-field-group')

    // B-26 / PATCHES §8: plain textbox semantics, never spinbutton or
    // numeric aria-value*.
    const exposure = await input.evaluate(el => ({
      role: el.getAttribute('role'),
      now: el.getAttribute('aria-valuenow'),
      min: el.getAttribute('aria-valuemin'),
      max: el.getAttribute('aria-valuemax'),
      text: el.getAttribute('aria-valuetext'),
    }))
    expect(exposure).toEqual({ role: null, now: null, min: null, max: null, text: null })
    await expect(input).toHaveValue('42')
    await expect(display).toHaveText('Numeric Value: 42')
    await page.waitForTimeout(300)
    await snap(page, 'numberfield-resting')
    await snap(root, 'numberfield-root-resting', { maxDiffPixelRatio: 0.001 })
    await snap(field, 'numberfield-control-resting', { maxDiffPixelRatio: 0.001 })

    const incBox = await btnInc.boundingBox()
    const decBox = await btnDec.boundingBox()
    expect(incBox).not.toBeNull()
    expect(decBox).not.toBeNull()
    expect(incBox!.width).toBeCloseTo(incBox!.height, 0)
    expect(decBox!.width).toBeCloseTo(decBox!.height, 0)

    // Hover increment button
    await btnInc.hover()
    await page.waitForTimeout(200)
    await snap(page, 'numberfield-hover-inc')

    // Click increment -> 43
    await btnInc.click()
    await expect(input).toHaveValue('43')
    await expect(display).toHaveText('Numeric Value: 43')
    await page.waitForTimeout(200)
    await snap(page, 'numberfield-incremented')

    // Hover decrement button
    await btnDec.hover()
    await page.waitForTimeout(200)
    await snap(page, 'numberfield-hover-dec')

    // Click decrement -> 42
    await btnDec.click()
    await expect(input).toHaveValue('42')
    await expect(display).toHaveText('Numeric Value: 42')
    await page.waitForTimeout(200)
    await snap(page, 'numberfield-decremented')

    // Keyboard ArrowUp -> 43
    await input.focus()
    await page.keyboard.press('ArrowUp')
    await expect(input).toHaveValue('43')
    await expect(display).toHaveText('Numeric Value: 43')
  })

  test('mouse click into NumberField changes border color without outline ring', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/StepperFixture')

    const root = page.getByTestId('number-field-group')
    const input = page.getByTestId('number-field-input')

    await input.click()
    await expect(input).toBeFocused()
    await page.waitForTimeout(200)
    await snap(page, 'numberfield-mouse-focused')

    const styles = await root.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
        borderColor: s.borderColor,
      }
    })

    const isOutlineAbsent =
      styles.outlineStyle === 'none' ||
      styles.outlineWidth === '0px' ||
      styles.outlineColor === 'rgba(0, 0, 0, 0)' ||
      styles.outlineColor === 'transparent' ||
      styles.outlineColor.includes('/ 0)')

    expect(isOutlineAbsent).toBe(true)
  })

  test('keyboard tab applies focus ring and keeps border color aligned with Field', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/StepperFixture')

    const root = page.getByTestId('number-field-group')
    const input = page.getByTestId('number-field-input')

    // Mouse click first to get pointer focus border
    await input.click()
    await expect(input).toBeFocused()

    const mouseClickStyles = await root.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
        borderColor: s.borderColor,
      }
    })

    // Native Tab into input via keyboard
    await page.locator('body').click({ position: { x: 5, y: 5 } })
    await input.evaluate(node => {
      const btn = document.createElement('button')
      btn.id = '__test_tab_shim__'
      btn.textContent = 'shim'
      node.parentNode?.insertBefore(btn, node)
      btn.focus()
    })
    await page.keyboard.press('Tab')
    await expect(input).toBeFocused()
    await page.locator('#__test_tab_shim__').evaluate(btn => btn?.remove()).catch(() => {})
    await page.waitForTimeout(200)
    await snap(page, 'numberfield-keyboard-focused')

    const keyboardTabStyles = await root.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
        borderColor: s.borderColor,
      }
    })

    // On keyboard tab: focus ring outline is 2px solid and non-transparent
    expect(keyboardTabStyles.outlineStyle).toBe('solid')
    expect(keyboardTabStyles.outlineWidth).toBe('2px')
    expect(keyboardTabStyles.outlineColor.includes('/ 0)')).toBe(false)
    // Border color on keyboard tab stays subtle and does not duplicate the white outline ring
    expect(keyboardTabStyles.borderColor).not.toBe(mouseClickStyles.borderColor)
  })

  test('stepper clicks focus input and apply focus border without outline ring', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/StepperFixture')

    const root = page.getByTestId('number-field-group')
    const input = page.getByTestId('number-field-input')
    const btnInc = page.getByTestId('btn-increment')
    const btnDec = page.getByTestId('btn-decrement')

    // Initial state: input not focused
    await expect(input).not.toBeFocused()

    const restingStyles = await root.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        borderColor: s.borderColor,
      }
    })

    // Click increment: focuses input, increments value, turns border to focus ring
    await btnInc.click()
    await expect(input).toBeFocused()
    await expect(input).toHaveValue('43')
    await page.waitForTimeout(200)
    await snap(page, 'numberfield-stepper-focused')

    const incStyles = await root.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
        borderColor: s.borderColor,
      }
    })

    const isOutlineAbsent =
      incStyles.outlineStyle === 'none' ||
      incStyles.outlineWidth === '0px' ||
      incStyles.outlineColor === 'rgba(0, 0, 0, 0)' ||
      incStyles.outlineColor === 'transparent' ||
      incStyles.outlineColor.includes('/ 0)')

    expect(isOutlineAbsent).toBe(true)
    expect(incStyles.borderColor).not.toBe(restingStyles.borderColor)

    // Click decrement: decrements value, keeps input focused and border at focus ring
    await btnDec.click()
    await expect(input).toBeFocused()
    await expect(input).toHaveValue('42')
    await page.waitForTimeout(200)

    const decStyles = await root.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
        borderColor: s.borderColor,
      }
    })
    expect(decStyles.borderColor).toBe(incStyles.borderColor)

    // Click outside to blur: field returns to resting border
    await page.locator('body').click({ position: { x: 5, y: 5 } })
    await expect(input).not.toBeFocused()
    await page.waitForTimeout(200)

    const blurredStyles = await root.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        borderColor: s.borderColor,
      }
    })
    expect(blurredStyles.borderColor).toBe(restingStyles.borderColor)
  })

  test('renders disabled NumberField', async ({ mount, page }) => {
    await mount('components/NumberField/NumberField/DisabledFixture')

    const root = page.getByTestId('disabled-number-field')
    const group = page.getByTestId('disabled-number-field-group')
    await expect(root).toBeVisible()
    await page.waitForTimeout(300)
    await snap(page, 'numberfield-disabled')
    await snap(group, 'numberfield-disabled-root', { maxDiffPixelRatio: 0.001 })
  })

  test('NF-KEY-01: unmodified Up and Down request one step per keydown', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/StepperFixture')

    const input = page.getByTestId('number-field-input')
    const display = page.getByTestId('number-field-value-display')

    await input.focus()
    await page.keyboard.press('ArrowDown')
    await expect(input).toHaveValue('41')
    await expect(display).toHaveText('Numeric Value: 41')
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('ArrowUp')
    await expect(input).toHaveValue('43')
    await expect(display).toHaveText('Numeric Value: 43')
  })

  test('NF-KEY-02: Shift+Arrow uses the fixed coarse delta 10 * step', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/StepperFixture')

    const input = page.getByTestId('number-field-input')
    const display = page.getByTestId('number-field-value-display')

    await input.focus()
    await page.keyboard.press('Shift+ArrowUp')
    await expect(input).toHaveValue('52')
    await expect(display).toHaveText('Numeric Value: 52')
    await page.keyboard.press('Shift+ArrowDown')
    await expect(input).toHaveValue('42')
    await expect(display).toHaveText('Numeric Value: 42')
  })

  test('NF-KEY-03: Alt-modified arrows remain completely native and unhandled', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/StepperFixture')

    const input = page.getByTestId('number-field-input')
    const display = page.getByTestId('number-field-value-display')

    await input.focus()
    for (const mod of ['Alt', 'Control', 'Meta'] as const) {
      await page.keyboard.down(mod)
      await page.keyboard.press('ArrowUp')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.up(mod)
    }
    await expect(input).toHaveValue('42')
    await expect(display).toHaveText('Numeric Value: 42')
  })

  test('NF-KEY-04: Home and End target supplied bounds only when unmodified and present', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/StepperFixture')

    const input = page.getByTestId('number-field-input')
    const display = page.getByTestId('number-field-value-display')

    await input.focus()
    await page.keyboard.press('Home')
    await expect(input).toHaveValue('0')
    await expect(display).toHaveText('Numeric Value: 0')
    await page.keyboard.press('End')
    await expect(input).toHaveValue('100')
    await expect(display).toHaveText('Numeric Value: 100')

    // Modified Home/End stay native: value unchanged.
    await page.keyboard.press('Shift+Home')
    await expect(input).toHaveValue('100')
    await expect(display).toHaveText('Numeric Value: 100')
  })

  test('NF-KEY-04: Home and End are native when bounds are absent', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/UnboundedFixture')

    const input = page.getByTestId('unbounded-number-field-input')

    await input.focus()
    await page.keyboard.press('Home')
    await expect(input).toHaveValue('5')
    await page.keyboard.press('End')
    await expect(input).toHaveValue('5')
  })

  test('NF-KEY-05: Unsupported keys remain native and never change the value', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/StepperFixture')

    const input = page.getByTestId('number-field-input')
    const display = page.getByTestId('number-field-value-display')

    await input.focus()
    await page.keyboard.press('a')
    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    await expect(input).toHaveValue('42')
    await expect(display).toHaveText('Numeric Value: 42')
  })

  test('NF-STEP-01: Named steppers control the real Input without adding a tab stop', async ({
    mount,
    page,
  }) => {
    // PATCHES §6: freeze-name proof — label/labelledby variants with exact
    // authored names under two locales, native button semantics, stepping
    // control, no tab stop. Resolving aria-controls + explicit/generated IDs
    // stay with PATCHES §4 (NF-DOM-07 same-commit retargeting).
    await mount('components/NumberField/NumberField/NamedStepperFixture')

    const inputEn = page.getByTestId('named-en-input')
    const btnIncEn = page.getByTestId('named-en-inc')
    const btnDecEn = page.getByTestId('named-en-dec')
    const inputDe = page.getByTestId('named-de-input')
    const btnIncDe = page.getByTestId('named-de-inc')
    const btnDecDe = page.getByTestId('named-de-dec')

    // Exact authored names on both variants; identical under de-DE —
    // locale changes never translate or replace authored names.
    await expect(btnDecEn).toHaveAttribute('aria-label', 'Decrease quantity')
    await expect(btnIncEn).toHaveAttribute('aria-labelledby', 'named-en-inc-label')
    await expect(btnIncEn).toHaveAccessibleName('Increase quantity')
    await expect(btnDecDe).toHaveAttribute('aria-label', 'Decrease quantity')
    await expect(btnIncDe).toHaveAttribute('aria-labelledby', 'named-de-inc-label')
    await expect(btnIncDe).toHaveAccessibleName('Increase quantity')
    await expect(page.getByTestId('named-en-field').getByRole('button', { name: 'Decrease quantity' })).toBeVisible()
    await expect(page.getByTestId('named-de-field').getByRole('button', { name: 'Increase quantity' })).toBeVisible()

    // Native button role/type, no tab stop.
    for (const btn of [btnIncEn, btnDecEn, btnIncDe, btnDecDe]) {
      await expect(btn).toHaveAttribute('tabindex', '-1')
      await expect(btn).toHaveAttribute('type', 'button')
    }

    // Named steppers control the real Input.
    await btnIncEn.click()
    await expect(inputEn).toHaveValue('43')
    await btnDecEn.click()
    await expect(inputEn).toHaveValue('42')
    await btnIncDe.click()
    await expect(inputDe).toHaveValue('43')

    // Tab reaches the single Input stop, then leaves past the steppers.
    await inputEn.evaluate(node => {
      const btn = document.createElement('button')
      btn.id = '__test_tab_shim__'
      btn.textContent = 'shim'
      node.parentNode?.insertBefore(btn, node)
      btn.focus()
    })
    await page.keyboard.press('Tab')
    await expect(inputEn).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(inputEn).not.toBeFocused()
    await expect(btnIncEn).not.toBeFocused()
    await expect(btnDecEn).not.toBeFocused()
    await page.locator('#__test_tab_shim__').evaluate(btn => btn?.remove()).catch(() => {})
  })

  test('NF-DOM-09: Missing, empty, or unresolved stepper names fail at runtime instead of receiving English fallback text', async ({
    mount,
    page,
  }) => {
    // PATCHES §6: one descriptive dev diagnostic per offender (absent
    // naming + unresolving labelledby); neither renders nor activates.
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await mount('components/NumberField/NumberField/UnnamedStepperFixture')

    const diags = () => errors.filter(t => t.includes('Reference UI: NumberField'))
    // Polling gates on the layout effects that deliver the diagnostics.
    await expect.poll(() => diags().length, { timeout: 5000 }).toBe(2)

    const field = page.getByTestId('unnamed-field')
    await expect(field).toBeVisible()
    await expect(page.getByTestId('unnamed-dec')).toHaveCount(0)
    await expect(page.getByTestId('unnamed-inc')).toHaveCount(0)
    await expect(field.getByRole('button')).toHaveCount(0)
    await expect(page.getByTestId('unnamed-input')).toHaveValue('42')

    expect(diags().some(t => /Decrement.*requires a nonempty/.test(t))).toBe(true)
    expect(diags().some(t => /Increment.*does not resolve/.test(t))).toBe(true)
  })

  test('NF-STEP-09: Secondary and auxiliary pointer buttons never start stepping', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/StepperFixture')

    const input = page.getByTestId('number-field-input')
    const btnInc = page.getByTestId('btn-increment')
    const display = page.getByTestId('number-field-value-display')

    // Synthetic non-primary activation: no step, no focus steal.
    await btnInc.evaluate(btn =>
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 1 }))
    )
    await btnInc.evaluate(btn =>
      btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 2 }))
    )
    await expect(input).toHaveValue('42')
    await expect(display).toHaveText('Numeric Value: 42')
    await expect(input).not.toBeFocused()
  })

  test('NF-MATH-07: Decimal stepper clicks remove floating drift in the UI', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/DecimalFixture')

    const input = page.getByTestId('decimal-number-field-input')
    const btnInc = page.getByTestId('decimal-btn-increment')

    await btnInc.click()
    await btnInc.click()
    await btnInc.click()
    await expect(input).toHaveValue('0.3')
  })

  test('NF-EDIT-04: Clearing requests null at commit, never mid-keystroke', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/StepperFixture')

    const input = page.getByTestId('number-field-input')
    const display = page.getByTestId('number-field-value-display')

    // B-19: the cleared text sits in the draft; the value holds until commit.
    await input.fill('')
    await expect(input).toHaveValue('')
    await expect(input).toHaveAttribute('data-editing', '')
    await expect(display).toHaveText('Numeric Value: 42')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('')
    await expect(display).toHaveText('Numeric Value: None')
  })

  test('B-19: Keystroke-typing a bounded decimal publishes once at commit', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/BoundedDecimalFixture')

    const input = page.getByTestId('bounded-decimal-input')
    const display = page.getByTestId('bounded-decimal-display')
    const log = page.getByTestId('bounded-decimal-log')

    await input.click()
    // True per-keystroke typing into the empty bounded (min 1, max 10)
    // field: the "." must survive instead of clamping the run to 10.
    await input.pressSequentially('2.5', { delay: 20 })
    await expect(input).toHaveValue('2.5')
    await expect(display).toHaveText('Decimal Value: None')
    await expect(log).toHaveText('requests: 0')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('2.5')
    await expect(display).toHaveText('Decimal Value: 2.5')
    await expect(log).toHaveText('requests: 1')
  })

  test('NF-EDIT-19: Focused Input leaves wheel behavior entirely native inside a scrollable ancestor', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/StepperFixture')

    const input = page.getByTestId('number-field-input')
    const display = page.getByTestId('number-field-value-display')

    // Zero wheel code in the engine: this title only pins the pass-through
    // (PATCHES §9). Synthetic wheels never scroll the page themselves, so
    // defaultPrevented false + consumer receipt is the native proxy.
    const result = await input.evaluate(node => {
      const el = node as HTMLInputElement
      const spacer = document.createElement('div')
      spacer.id = '__nf_wheel_spacer__'
      spacer.style.height = '300vh'
      document.body.appendChild(spacer)

      const seen: Array<{
        dy: number
        dx: number
        shift: boolean
        ctrl: boolean
        prevented: boolean
      }> = []
      const onWheel = (e: WheelEvent) => {
        seen.push({
          dy: e.deltaY,
          dx: e.deltaX,
          shift: e.shiftKey,
          ctrl: e.ctrlKey,
          prevented: e.defaultPrevented,
        })
      }
      el.addEventListener('wheel', onWheel)
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
      const selectionBefore = [el.selectionStart, el.selectionEnd]

      const cases: WheelEventInit[] = [
        { deltaY: 100 },
        { deltaX: 100 },
        { deltaY: 100, shiftKey: true },
        { deltaY: 100, ctrlKey: true },
      ]
      for (const init of cases) {
        el.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init }))
      }

      const outcome = {
        seen,
        text: el.value,
        selectionBefore,
        selectionAfter: [el.selectionStart, el.selectionEnd],
        now: el.getAttribute('aria-valuenow'),
        editing: el.getAttribute('data-editing'),
      }
      el.removeEventListener('wheel', onWheel)
      spacer.remove()
      return outcome
    })

    // Consumer receives every native event, none prevented.
    expect(result.seen).toHaveLength(4)
    expect(result.seen.map(s => [s.dy, s.dx, s.shift, s.ctrl])).toEqual([
      [100, 0, false, false],
      [0, 100, false, false],
      [100, 0, true, false],
      [100, 0, false, true],
    ])
    expect(result.seen.every(s => s.prevented === false)).toBe(true)
    // Value, callback echo, text, selection, managed data unchanged.
    expect(result.text).toBe('42')
    expect(result.selectionAfter).toEqual(result.selectionBefore)
    expect(result.now).toBeNull()
    expect(result.editing).toBeNull()
    await expect(input).toHaveValue('42')
    await expect(display).toHaveText('Numeric Value: 42')
  })

  test('W-02: snap commitBehavior coerces typed 2.5 to 3 with one onChange', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/SnapFixture')

    const input = page.getByTestId('snap-input')
    const display = page.getByTestId('snap-display')
    const log = page.getByTestId('snap-log')

    await input.click()
    await input.pressSequentially('2.5', { delay: 20 })
    await expect(input).toHaveValue('2.5')
    await expect(display).toHaveText('Snap Value: None')
    await expect(log).toHaveText('requests: 0')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('3')
    await expect(display).toHaveText('Snap Value: 3')
    await expect(log).toHaveText('requests: 1')
  })

  test('W-02: validate commitBehavior reverts bad commits and reports them', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/ValidateFixture')

    const input = page.getByTestId('validate-input')
    const display = page.getByTestId('validate-display')
    const log = page.getByTestId('validate-log')

    await expect(input).toHaveValue('5')
    await input.fill('2.5')
    await expect(display).toHaveText('Validate Value: 5')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('5')
    await expect(display).toHaveText('Validate Value: 5')
    await expect(log).toHaveText('invalid: 2.5:off-step')

    await input.fill('25')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('5')
    await expect(display).toHaveText('Validate Value: 5')
    await expect(log).toHaveText('invalid: 2.5:off-step, 25:out-of-range')

    await input.fill('7')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('7')
    await expect(display).toHaveText('Validate Value: 7')
    await expect(log).toHaveText('invalid: 2.5:off-step, 25:out-of-range')
  })

  test('W-25: currency formatOptions display formatted text, commit plain numbers', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CurrencyFixture')

    const input = page.getByTestId('currency-input')
    const display = page.getByTestId('currency-display')

    await expect(input).toHaveValue('$1,234.50')
    await expect(display).toHaveText('Currency Value: 1234.5')

    // Typing never fights the formatter: raw keystrokes stay verbatim and
    // unpublished until commit.
    await input.fill('')
    await input.pressSequentially('99.99', { delay: 20 })
    await expect(input).toHaveValue('99.99')
    await expect(display).toHaveText('Currency Value: 1234.5')
    await page.keyboard.press('Enter')
    await expect(display).toHaveText('Currency Value: 99.99')
    await expect(input).toHaveValue('$99.99')
  })

  test('W-25: percent formatOptions scale typed input to plain fractions', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/PercentFixture')

    const input = page.getByTestId('percent-input')
    const display = page.getByTestId('percent-display')

    await expect(input).toHaveValue('12%')
    await expect(display).toHaveText('Percent Value: 0.12')

    await input.fill('25')
    await expect(display).toHaveText('Percent Value: 0.12')
    await page.keyboard.press('Enter')
    await expect(display).toHaveText('Percent Value: 0.25')
    await expect(input).toHaveValue('25%')
  })

  test('controlled unbounded field steps from echoed state (FEATURES #1: no uncontrolled mode)', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/UnboundedFixture')

    const input = page.getByTestId('unbounded-number-field-input')
    const btnInc = page.getByTestId('unbounded-btn-increment')
    const btnDec = page.getByTestId('unbounded-btn-decrement')

    await expect(input).toHaveValue('5')
    await btnInc.click()
    await expect(input).toHaveValue('6')
    await btnDec.click()
    await btnDec.click()
    await expect(input).toHaveValue('4')
    await input.focus()
    await page.keyboard.press('ArrowUp')
    await expect(input).toHaveValue('5')
  })

  test('NF-DOM-01: NumberField renders exactly one root div, group div, text input, and authored stepper buttons', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/StepperFixture')

    const host = page.getByTestId('number-field-root')
    const group = page.getByTestId('number-field-group')
    const input = page.getByTestId('number-field-input')

    // Fixed tags and managed roles.
    await expect(host).toHaveJSProperty('tagName', 'DIV')
    await expect(host).not.toHaveAttribute('role')
    await expect(host).not.toHaveAttribute('data-reference-field')
    await expect(group).toHaveJSProperty('tagName', 'DIV')
    await expect(group).toHaveAttribute('role', 'group')
    await expect(group).toHaveAttribute('data-reference-field', '')
    await expect(group).toHaveAttribute('data-reference-number-field', '')

    // Authored order, no wrapper: decrement, text input, increment.
    const order = await group.evaluate(el =>
      Array.from(el.children).map(c => `${c.tagName}:${c.getAttribute('type') ?? ''}`)
    )
    expect(order).toEqual(['BUTTON:button', 'INPUT:text', 'BUTTON:button'])

    // Plain textbox exposure, never spinbutton or native number.
    await expect(input).toHaveAttribute('type', 'text')
    await expect(input).not.toHaveAttribute('role')
    await expect(input).not.toHaveAttribute('aria-valuenow')
    await expect(page.locator('[role="spinbutton"]')).toHaveCount(0)
    await expect(page.locator('input[type="number"]')).toHaveCount(0)

    // Accessible textbox name resolves in the tree.
    await expect(page.getByRole('textbox', { name: 'Quantity' })).toBeVisible()
  })

  test('NF-DOM-02: A name adds only one direct canonical hidden form input', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/NamedFormFixture')

    const host = page.getByTestId('named-form-field')
    const input = page.getByTestId('named-form-input')

    // Exactly one root-direct hidden input with canonical text.
    const hiddenCount = await host.evaluate(
      el => el.querySelectorAll(':scope > input[type="hidden"]').length
    )
    expect(hiddenCount).toBe(1)
    const hidden = host.locator(':scope > input[type="hidden"]')
    await expect(hidden).toHaveAttribute('name', 'price')
    await expect(hidden).toHaveValue('1234.5')

    // Visible Input shows localized text and carries no name.
    await expect(input).toHaveValue('$1,234.50')
    await expect(input).not.toHaveAttribute('name')
  })

  test('NF-SURF-01: Group consumes the Field recipe on its own group node', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/NamedFormFixture')

    const host = page.getByTestId('named-form-field')
    const group = page.getByTestId('named-form-group')

    // Exactly one group host, no nested Field-surface node.
    expect(await host.locator('div[role="group"][data-reference-field]').count()).toBe(1)
    expect(await group.locator('[data-reference-field]').count()).toBe(0)

    // Warning status is visual only: data-status set, aria-invalid absent.
    await expect(group).toHaveAttribute('data-status', 'warning')
    await expect(group).not.toHaveAttribute('aria-invalid')
    const warningBorder = await group.evaluate(el => window.getComputedStyle(el).borderColor)
    expect(warningBorder.startsWith('oklab(0.7') || warningBorder.startsWith('oklch(0.7')).toBe(true)

    // Embedded input: no standalone border inside the bezel.
    const inputBorder = await page
      .getByTestId('named-form-input')
      .evaluate(el => window.getComputedStyle(el).borderWidth)
    expect(inputBorder).toBe('0px')
  })

  test('NF-FORM-02: A named field submits one canonical pair from the live form', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/NamedFormFixture')

    const payload = page.getByTestId('named-form-payload')
    await expect(payload).toHaveText('payload: none')
    await page.getByTestId('named-form-submit').click()
    await expect(payload).toHaveText('payload: price=1234.5')
  })

  test('NF-FORMAT-03: Referentially new but effectively equal format options preserve a dirty session', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/FormatSwapFixture')

    const input = page.getByTestId('format-swap-input')
    const log = page.getByTestId('format-swap-log')
    await input.click()
    await input.fill('1234.5')
    await input.evaluate(el => (el as HTMLInputElement).setSelectionRange(2, 5))
    const before = await input.evaluate(el => ({
      value: (el as HTMLInputElement).value,
      start: (el as HTMLInputElement).selectionStart,
      end: (el as HTMLInputElement).selectionEnd,
      editing: el.getAttribute('data-editing'),
    }))
    await input.evaluate(el => {
      ;(window as unknown as { __nfNode: unknown }).__nfNode = el
    })
    // Mousedown-prevented swap: rerender without blur, so only option
    // equality is under test.
    await page.getByTestId('format-swap-same').click()
    const after = await input.evaluate(el => ({
      value: (el as HTMLInputElement).value,
      start: (el as HTMLInputElement).selectionStart,
      end: (el as HTMLInputElement).selectionEnd,
      editing: el.getAttribute('data-editing'),
      sameNode: el === (window as unknown as { __nfNode: unknown }).__nfNode,
    }))
    expect(after).toEqual({ ...before, sameNode: true })
    await expect(input).toBeFocused()
    await expect(log).toHaveText('log: none')
  })

  test('NF-FORMAT-04: An effective format change replaces dirty text from controlled state', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/FormatSwapFixture')

    const input = page.getByTestId('format-swap-input')
    const log = page.getByTestId('format-swap-log')
    const hidden = page.locator('input[name="price"]')
    await input.click()
    await input.fill('999')
    await expect(input).toHaveAttribute('data-editing', '')
    await page.getByTestId('format-swap-eur').click()
    await expect(input).toHaveValue('€1,234.50')
    await expect(input).not.toHaveAttribute('data-editing', '')
    await expect(hidden).toHaveValue('1234.5')
    await expect(log).toHaveText('log: none')
    await expect(input).toBeFocused()
  })

  test('NF-EDIT-01: Focusing clean Input does not start a dirty session', async ({ mount, page }) => {
    // Keyboard focus shares the programmatic focus path (no key-specific
    // focus logic exists), so pointer + programmatic focus prove the case.
    await mount('components/NumberField/NumberField/StepperFixture')
    const input = page.getByTestId('number-field-input')
    await input.click()
    await expect(input).toBeFocused()
    await expect(input).toHaveValue('42')
    await expect(input).not.toHaveAttribute('data-editing', '')
    await expect(page.getByTestId('number-field-value-display')).toHaveText('Numeric Value: 42')
    await input.evaluate(el => (el as HTMLInputElement).blur())
    await input.evaluate(el => (el as HTMLInputElement).focus())
    await expect(input).toHaveValue('42')
    await expect(input).not.toHaveAttribute('data-editing', '')
    await expect(page.getByTestId('number-field-value-display')).toHaveText('Numeric Value: 42')
  })

  test('NF-EDIT-01: Focusing null and formatted fields leaves them clean', async ({ mount, page }) => {
    await mount('components/NumberField/NumberField/CurrencyFixture')
    const currency = page.getByTestId('currency-input')
    await currency.click()
    await expect(currency).toHaveValue('$1,234.50')
    await expect(currency).not.toHaveAttribute('data-editing', '')
    await expect(page.getByTestId('currency-display')).toHaveText('Currency Value: 1234.5')

    await mount('components/NumberField/NumberField/BoundedDecimalFixture')
    const empty = page.getByTestId('bounded-decimal-input')
    await empty.click()
    await expect(empty).toHaveValue('')
    await expect(empty).not.toHaveAttribute('data-editing', '')
    await expect(page.getByTestId('bounded-decimal-log')).toHaveText('requests: 0')
  })

  test('NF-EDIT-06: Horizontal navigation and selection remain native around localized tokens', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/NumberField/NumberField/UnboundedFixture')
    const input = page.getByTestId('unbounded-number-field-input')
    await input.click()
    const sel = () =>
      input.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
    // Platform: bare Home/End are caret no-ops in Firefox/WebKit macOS
    // builds — Playwright delivers identical key events on all engines and
    // the product correctly leaves the keys unhandled on unbounded fields,
    // but only Chromium binds the native caret move (DIAG D3A). Assert the
    // native outcome per engine: Chromium moves, FF/WebKit hold position.
    const homeEndMove = browserName === 'chromium'
    const afterClick = await sel()
    await page.keyboard.press('End')
    expect(await sel()).toEqual(homeEndMove ? [1, 1] : afterClick)
    await page.keyboard.press('Home')
    expect(await sel()).toEqual(homeEndMove ? [0, 0] : afterClick)
    await page.keyboard.press('ArrowRight')
    expect(await sel()).toEqual([1, 1])
    await page.keyboard.press('Shift+ArrowLeft')
    expect(await sel()).toEqual([0, 1])
    await page.keyboard.press('ArrowRight')
    expect(await sel()).toEqual([1, 1])
    // Same platform class, split outcome: Control+ArrowLeft word-jumps on
    // Chromium and WebKit, but is a caret no-op on Firefox macOS (where
    // word-jump is Option+Arrow). Product leaves it unhandled everywhere.
    await page.keyboard.press('Control+ArrowLeft')
    expect(await sel()).toEqual(browserName === 'firefox' ? [1, 1] : [0, 0])
    await expect(input).toHaveValue('5')
    // Ranged dirty buffer incl. RTL text: navigation alone never commits.
    await input.fill('12א')
    await page.keyboard.press('Home')
    expect(await sel()).toEqual(homeEndMove ? [0, 0] : [3, 3])
    await page.keyboard.press('End')
    expect(await sel()).toEqual([3, 3])
    await expect(input).toHaveValue('12א')

    // No-request half on the echoing fixture: horizontal arrows never
    // publish (Home/End omitted here — that fixture has bounds, so they are
    // handled endpoint keys, proved natively above on the unbounded field).
    await mount('components/NumberField/NumberField/StepperFixture')
    const echoing = page.getByTestId('number-field-input')
    await echoing.click()
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('Shift+ArrowRight')
    await page.keyboard.press('ArrowRight')
    await expect(echoing).toHaveValue('42')
    await expect(page.getByTestId('number-field-value-display')).toHaveText('Numeric Value: 42')
  })

  test('NF-EDIT-10: Unreadable clipboard data fails open without fabricating an edit', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/StepperFixture')
    const errors: string[] = []
    page.on('pageerror', error => errors.push(String(error)))
    const input = page.getByTestId('number-field-input')
    await input.click()
    await input.evaluate(el => {
      el.dispatchEvent(new Event('paste', { bubbles: true, cancelable: true }))
    })
    await expect(input).toHaveValue('42')
    await expect(page.getByTestId('number-field-value-display')).toHaveText('Numeric Value: 42')
    await input.evaluate(el => {
      const event = new Event('paste', { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'clipboardData', {
        get() {
          throw new Error('denied')
        },
      })
      el.dispatchEvent(event)
    })
    await expect(input).toHaveValue('42')
    await expect(page.getByTestId('number-field-value-display')).toHaveText('Numeric Value: 42')
    await expect(input).toBeFocused()
    expect(errors).toEqual([])
  })

  test('NF-EDIT-11: Synthetic composition suspends filtering, stepping, and commit until its final event', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    const log = page.getByTestId('commit-lab-log')
    await input.click()
    const prevention = await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      target.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, cancelable: true }))
      setter.call(target, 'ni3hao')
      target.dispatchEvent(new Event('input', { bubbles: true }))
      const enter = !target.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, isComposing: true })
      )
      const arrow = !target.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true, isComposing: true })
      )
      return { enter, arrow }
    })
    expect(prevention).toEqual({ enter: false, arrow: false })
    await expect(input).toHaveValue('ni3hao')
    await expect(log).toHaveText('log: none')
    // Valid final text flows through the ordinary input path; the boundary
    // after the session commits it exactly once.
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      setter.call(target, '12')
      target.dispatchEvent(new Event('input', { bubbles: true }))
      target.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, cancelable: true }))
    })
    await expect(log).toHaveText('log: none')
    await page.getByTestId('commit-lab-outside').click()
    await expect(log).toHaveText('log: 12')
    await expect(page.getByTestId('commit-lab-display')).toHaveText('Value: 12')
  })

  test('NF-EDIT-14: Rejected live requests do not create a hidden numeric store', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    const display = page.getByTestId('commit-lab-display')
    const log = page.getByTestId('commit-lab-log')
    const hidden = page.locator('input[name="qty"]')
    // Echo off while clean: every later request is rejected by the parent.
    await page.getByTestId('commit-lab-echo-off').click()
    await input.click()
    for (const text of ['1', '12', '42']) {
      await input.fill(text)
      await expect(input).toHaveValue(text)
      await expect(display).toHaveText('Value: 5')
      await expect(hidden).toHaveValue('5')
    }
    await expect(log).toHaveText('log: none')
    // The later request derives from the current buffer, still prop-based.
    await page.keyboard.press('Enter')
    await expect(log).toHaveText('log: 42')
    await expect(display).toHaveText('Value: 5')
    await expect(hidden).toHaveValue('5')
    await expect(input).toHaveValue('5')
  })

  test('NF-COMMIT-01: Blur commits after the consumer handler and retries a candidate that differs from controlled value', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    const order = page.getByTestId('commit-lab-order')
    const log = page.getByTestId('commit-lab-log')
    const display = page.getByTestId('commit-lab-display')
    const hidden = page.locator('input[name="qty"]')
    await input.click()
    await input.fill('7')
    await expect(log).toHaveText('log: none')
    await page.getByTestId('commit-lab-outside').click()
    await expect(order).toHaveText('order: blur,request')
    await expect(log).toHaveText('log: 7')
    await expect(display).toHaveText('Value: 7')
    await expect(hidden).toHaveValue('7')
    // Platform: Safari never moves focus on click — buttons/links are not
    // click-focusable (only text controls take click focus; mousedown still
    // blurs, so the commit above fires identically). The landing differs,
    // not the publish (DIAG D1A).
    if (browserName === 'webkit') {
      await expect(page.getByTestId('commit-lab-outside')).not.toBeFocused()
    } else {
      await expect(page.getByTestId('commit-lab-outside')).toBeFocused()
    }
    // Delayed echo: the request publishes, hidden stays controlled, and an
    // explicit retry after echo-on lands the value.
    await page.getByTestId('commit-lab-echo-off').click()
    await input.click()
    await input.fill('8')
    await page.getByTestId('commit-lab-outside').click()
    await expect(log).toHaveText('log: 7,8')
    await expect(display).toHaveText('Value: 7')
    await expect(hidden).toHaveValue('7')
    await page.getByTestId('commit-lab-echo-on').click()
    await input.click()
    await input.fill('8')
    await page.getByTestId('commit-lab-outside').click()
    await expect(log).toHaveText('log: 7,8,8')
    await expect(display).toHaveText('Value: 8')
  })

  test('NF-COMMIT-02: Enter commits without moving focus or synthesizing form submission', async ({
    mount,
    page,
  }) => {
    // Standalone half: no form exists, so no submission path is reachable.
    await mount('components/NumberField/NumberField/StepperFixture')
    const standalone = page.getByTestId('number-field-input')
    await standalone.click()
    await standalone.fill('43')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('number-field-value-display')).toHaveText('Numeric Value: 43')
    await expect(standalone).toHaveValue('43')
    await expect(standalone).toBeFocused()
    // In-form half: consumer key handler first, one commit, focus retained,
    // and at most the browser's single implicit submit — never a second
    // NumberField-synthesized submission (the engine calls no submit API).
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    await input.click()
    await input.fill('9')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('commit-lab-order')).toHaveText('order: key,request')
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: 9')
    await expect(page.getByTestId('commit-lab-display')).toHaveText('Value: 9')
    await expect(input).toBeFocused()
    const submits = await page.getByTestId('commit-lab-submits').textContent()
    expect(['submits: 0', 'submits: 1']).toContain(submits?.trim())
  })

  test('NF-FORM-09: Autofill-equivalent input/change events follow ordinary public edit and commit rules', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    const log = page.getByTestId('commit-lab-log')
    const display = page.getByTestId('commit-lab-display')
    const hidden = page.locator('input[name="qty"]')
    await input.click()
    const focusedTag = await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      setter.call(target, '42')
      target.dispatchEvent(new Event('input', { bubbles: true }))
      target.dispatchEvent(new Event('change', { bubbles: true }))
      const active = target.ownerDocument.activeElement
      return active === target ? 'input' : active?.tagName ?? 'none'
    })
    expect(focusedTag).toBe('input')
    await expect(input).toHaveValue('42')
    await expect(log).toHaveText('log: none')
    await page.getByTestId('commit-lab-outside').click()
    await expect(log).toHaveText('log: 42')
    await expect(display).toHaveText('Value: 42')
    await expect(hidden).toHaveValue('42')
    // Reject run: callbacks fire, controlled/hidden state stays prop-based.
    await page.getByTestId('commit-lab-echo-off').click()
    await input.click()
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      setter.call(target, '43')
      target.dispatchEvent(new Event('input', { bubbles: true }))
      target.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await page.getByTestId('commit-lab-outside').click()
    await expect(log).toHaveText('log: 42,43')
    await expect(display).toHaveText('Value: 42')
    await expect(hidden).toHaveValue('42')
  })

  test('NF-DYNAMIC-02: Locale and effective format changes atomically replace parser, formatter, grammar, and inputMode', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/FormatSwapFixture')
    const input = page.getByTestId('format-swap-input')
    const log = page.getByTestId('format-swap-log')
    const hidden = page.locator('input[name="price"]')
    await expect(input).toHaveAttribute('inputmode', 'numeric')
    await input.click()
    await input.fill('999')
    await input.evaluate(el => {
      ;(window as unknown as { __nfNode: unknown }).__nfNode = el
    })
    await page.getByTestId('format-swap-de').click()
    const expectedDe = await page.evaluate(() =>
      new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(1234.5)
    )
    await expect(input).toHaveValue(expectedDe)
    await expect(input).toHaveAttribute('inputmode', 'numeric')
    await expect(input).not.toHaveAttribute('data-editing', '')
    await expect(input).not.toHaveAttribute('aria-invalid', 'true')
    await expect(hidden).toHaveValue('1234.5')
    await expect(log).toHaveText('log: none')
    await expect(input).toBeFocused()
    const sameAfterLocale = await input.evaluate(
      el => el === (window as unknown as { __nfNode: unknown }).__nfNode
    )
    expect(sameAfterLocale).toBe(true)
    // Scientific grammar flips inputMode with the same atomic replacement.
    await input.fill('1500')
    await page.getByTestId('format-swap-scientific').click()
    const expectedSci = await page.evaluate(() =>
      new Intl.NumberFormat('de-DE', { notation: 'scientific' }).format(1234.5)
    )
    await expect(input).toHaveValue(expectedSci)
    await expect(input).toHaveAttribute('inputmode', 'text')
    await expect(log).toHaveText('log: none')
    const sameAfterNotation = await input.evaluate(
      el => el === (window as unknown as { __nfNode: unknown }).__nfNode
    )
    expect(sameAfterNotation).toBe(true)
  })

  test('NF-COMP-01: A quantity NumberField composes integer bounds, named steppers, controlled rejection, reset, and forms', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    const display = page.getByTestId('commit-lab-display')
    const log = page.getByTestId('commit-lab-log')
    const hidden = page.locator('input[name="qty"]')
    const inc = page.getByRole('button', { name: 'Increment' })
    const dec = page.getByRole('button', { name: 'Decrement' })
    await expect(inc).toHaveAttribute('aria-controls', await input.getAttribute('id'))
    // Type to 99, then hold Increment: the immediate step lands 100 and the
    // bound ends the hold with no further request.
    await input.click()
    await input.fill('99')
    await page.keyboard.press('Enter')
    await expect(display).toHaveText('Value: 99')
    // Enter may additionally implicit-submit (browser path, echo-timing
    // dependent), so the explicit submit below asserts a relative +1.
    const submitsAfterEnter = Number(
      ((await page.getByTestId('commit-lab-submits').textContent()) ?? 'submits: 0')
        .replace('submits:', '')
        .trim()
    )
    const box = await inc.boundingBox()
    expect(box).not.toBeNull()
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(550)
    await page.mouse.up()
    await expect(log).toHaveText('log: 99,100')
    await expect(display).toHaveText('Value: 100')
    await expect(inc).toBeDisabled()
    // Controlled rejection: the request publishes, the display stands.
    await page.getByTestId('commit-lab-echo-off').click()
    await dec.click()
    await expect(log).toHaveText('log: 99,100,99')
    await expect(display).toHaveText('Value: 100')
    await page.getByTestId('commit-lab-echo-on').click()
    // Reset from a dirty session: blur commits first (rejected, echo off),
    // then reset clears the transient state around the standing authority.
    await page.getByTestId('commit-lab-echo-off').click()
    await input.click()
    await input.fill('50')
    await page.getByTestId('commit-lab-reset').click()
    await expect(input).toHaveValue('100')
    await expect(display).toHaveText('Value: 100')
    await expect(log).toHaveText('log: 99,100,99,50')
    // Submit serializes the canonical hidden value exactly once.
    await page.getByTestId('commit-lab-submit').click()
    await expect(page.getByTestId('commit-lab-submits')).toHaveText(`submits: ${submitsAfterEnter + 1}`)
    await expect(hidden).toHaveValue('100')
  })

  test('NF-FORM-11: Clicking submit from dirty partial or unaccepted complete blocks stale serialization', async ({
    mount,
    page,
  }) => {
    // Submit probe: registered after the engine listener, so
    // defaultPrevented reflects engine blocking, and qty shows the hidden
    // value that would have serialized.
    const installProbe = () =>
      page.evaluate(() => {
        const form = document.querySelector('[data-testid="commit-lab-form"]') as HTMLFormElement
        ;(
          window as unknown as { __nfSubmits: Array<{ prevented: boolean; qty: string | null }> }
        ).__nfSubmits = []
        form.addEventListener('submit', e => {
          ;(
            window as unknown as { __nfSubmits: Array<{ prevented: boolean; qty: string | null }> }
          ).__nfSubmits.push({
            prevented: e.defaultPrevented,
            qty: new FormData(form).get('qty') as string | null,
          })
        })
      })
    const probe = () =>
      page.evaluate(
        () =>
          (window as unknown as { __nfSubmits: Array<{ prevented: boolean; qty: string | null }> })
            .__nfSubmits
      )
    // Run A: incomplete partial, echo on. Blur runs first (consumer blur,
    // failed commit, no request), the ensuing submit is prevented, and the
    // old hidden value never escapes.
    const lab = await mount('components/NumberField/NumberField/CommitLabFixture')
    await installProbe()
    const input = page.getByTestId('commit-lab-input')
    const hidden = page.locator('input[name="qty"]')
    const submits = page.getByTestId('commit-lab-submits')
    await input.click()
    await input.fill('-')
    await page.getByTestId('commit-lab-submit').click()
    await expect(page.getByTestId('commit-lab-order')).toHaveText('order: blur')
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: none')
    await expect(input).toHaveValue('5')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(hidden).toHaveValue('5')
    await expect.poll(async () => (await probe()).length).toBe(1)
    expect(await probe()).toEqual([{ prevented: true, qty: '5' }])
    // The fixture counts delivered submit events (its React handler runs
    // regardless of prevention); the probe's prevented flag is the blocking
    // signal.
    await expect(submits).toHaveText('submits: 1')
    // Repeated click attempts remain blocked without consuming failed state.
    await page.getByTestId('commit-lab-submit').click()
    await page.getByTestId('commit-lab-submit').click()
    await expect.poll(async () => (await probe()).length).toBe(3)
    await expect(submits).toHaveText('submits: 3')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: none')
    expect(await probe()).toEqual([
      { prevented: true, qty: '5' },
      { prevented: true, qty: '5' },
      { prevented: true, qty: '5' },
    ])
    // Resolution: a subsequent valid user edit clears the boundary, the
    // accepted commit lands, and the next click submits canonically.
    await input.click()
    await input.fill('7')
    await expect(input).not.toHaveAttribute('aria-invalid', 'true')
    await page.getByTestId('commit-lab-outside').click()
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: 7')
    await expect(page.getByTestId('commit-lab-display')).toHaveText('Value: 7')
    await page.getByTestId('commit-lab-submit').click()
    await expect(submits).toHaveText('submits: 4')
    await expect.poll(async () => (await probe()).length).toBe(4)
    expect(await probe()).toEqual([
      { prevented: true, qty: '5' },
      { prevented: true, qty: '5' },
      { prevented: true, qty: '5' },
      { prevented: false, qty: '7' },
    ])
    // Run B: complete but unaccepted (echo off) — blur-first request, then
    // pending-blocked submit and retries; an unprevented reset clears the
    // boundary and a later accepted commit submits.
    await lab.unmount()
    await mount('components/NumberField/NumberField/CommitLabFixture')
    await installProbe()
    const inputB = page.getByTestId('commit-lab-input')
    const submitsB = page.getByTestId('commit-lab-submits')
    await page.getByTestId('commit-lab-echo-off').click()
    await inputB.click()
    await inputB.fill('8')
    await page.getByTestId('commit-lab-submit').click()
    await expect(page.getByTestId('commit-lab-order')).toHaveText('order: blur,request')
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: 8')
    await expect(page.getByTestId('commit-lab-display')).toHaveText('Value: 5')
    await expect.poll(async () => (await probe()).length).toBe(1)
    expect(await probe()).toEqual([{ prevented: true, qty: '5' }])
    await expect(submitsB).toHaveText('submits: 1')
    await page.getByTestId('commit-lab-submit').click()
    await expect.poll(async () => (await probe()).length).toBe(2)
    await expect(submitsB).toHaveText('submits: 2')
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: 8')
    expect(await probe()).toEqual([
      { prevented: true, qty: '5' },
      { prevented: true, qty: '5' },
    ])
    await page.getByTestId('commit-lab-reset').click()
    await expect(inputB).toHaveValue('5')
    await page.getByTestId('commit-lab-echo-on').click()
    await inputB.click()
    await inputB.fill('8')
    await page.getByTestId('commit-lab-outside').click()
    await expect(page.getByTestId('commit-lab-display')).toHaveText('Value: 8')
    await page.getByTestId('commit-lab-submit').click()
    await expect(submitsB).toHaveText('submits: 3')
    await expect.poll(async () => (await probe()).length).toBe(3)
    expect((await probe()).at(-1)).toEqual({ prevented: false, qty: '8' })
  })

  test('NF-FORM-12: Implicit Enter submit after an unaccepted key commit stays blocked without a second submit', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CommitLabFixture')
    await page.evaluate(() => {
      const form = document.querySelector('[data-testid="commit-lab-form"]') as HTMLFormElement
      ;(window as unknown as { __nfSubmits: Array<{ prevented: boolean; qty: string | null }> }).__nfSubmits =
        []
      form.addEventListener('submit', e => {
        ;(
          window as unknown as { __nfSubmits: Array<{ prevented: boolean; qty: string | null }> }
        ).__nfSubmits.push({
          prevented: e.defaultPrevented,
          qty: new FormData(form).get('qty') as string | null,
        })
      })
    })
    const probe = () =>
      page.evaluate(
        () =>
          (window as unknown as { __nfSubmits: Array<{ prevented: boolean; qty: string | null }> })
            .__nfSubmits
      )
    const input = page.getByTestId('commit-lab-input')
    const submits = page.getByTestId('commit-lab-submits')
    await input.click()
    await input.fill('-')
    await page.keyboard.press('Enter')
    // Key commit precedes the native implicit submit: exactly one submit
    // event (never a NumberField-synthesized second), prevented, carrying
    // the controlled hidden value — never the partial.
    await expect(page.getByTestId('commit-lab-order')).toHaveText('order: key')
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: none')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toBeFocused()
    await expect.poll(async () => (await probe()).length).toBe(1)
    expect(await probe()).toEqual([{ prevented: true, qty: '5' }])
    await expect(submits).toHaveText('submits: 1')
    // Repeated Enter and click attempts remain blocked without consumption.
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await probe()).length).toBe(2)
    await page.getByTestId('commit-lab-submit').click()
    await expect.poll(async () => (await probe()).length).toBe(3)
    await expect(submits).toHaveText('submits: 3')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: none')
    expect(await probe()).toEqual([
      { prevented: true, qty: '5' },
      { prevented: true, qty: '5' },
      { prevented: true, qty: '5' },
    ])
    // Resolution: a valid accepted edit clears the boundary/invalid state,
    // then submit succeeds (relative count — Enter may additionally
    // implicit-submit depending on echo timing, COMP-01 pattern).
    await input.click()
    await input.fill('9')
    await expect(input).not.toHaveAttribute('aria-invalid', 'true')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: 9')
    await expect(page.getByTestId('commit-lab-display')).toHaveText('Value: 9')
    const submitsAfterEnter = Number(
      ((await submits.textContent()) ?? 'submits: 0').replace('submits:', '').trim()
    )
    await page.getByTestId('commit-lab-submit').click()
    await expect(submits).toHaveText(`submits: ${submitsAfterEnter + 1}`)
    await expect.poll(async () => (await probe()).at(-1)?.prevented).toBe(false)
    expect((await probe()).at(-1)).toEqual({ prevented: false, qty: '9' })
  })

  test('NF-FORM-14: Clicked reset applies blur first and cancellation preserves post-blur state', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    const display = page.getByTestId('commit-lab-display')
    const log = page.getByTestId('commit-lab-log')
    const order = page.getByTestId('commit-lab-order')
    const hidden = page.locator('input[name="qty"]')
    // Accepted run: blur commits first (echo on), reset clears transient.
    await input.click()
    await input.fill('50')
    await page.getByTestId('commit-lab-reset').click()
    await expect(order).toHaveText('order: blur,request')
    await expect(log).toHaveText('log: 50')
    await expect(display).toHaveText('Value: 50')
    await expect(input).toHaveValue('50')
    await expect(input).not.toHaveAttribute('data-editing', '')
    // Rejected run: blur publishes, reset clears pending around authority.
    await page.getByTestId('commit-lab-echo-off').click()
    await input.click()
    await input.fill('60')
    await page.getByTestId('commit-lab-reset').click()
    await expect(log).toHaveText('log: 50,60')
    await expect(display).toHaveText('Value: 50')
    await expect(input).toHaveValue('50')
    await expect(hidden).toHaveValue('50')
    // Incomplete run: blur records the boundary, reset clears it.
    await input.click()
    await input.fill('-')
    await page.getByTestId('commit-lab-reset').click()
    await expect(input).toHaveValue('50')
    await expect(input).not.toHaveAttribute('aria-invalid', 'true')
    await expect(log).toHaveText('log: 50,60')
    // Canceled run: an application capture-cancel preserves the post-blur
    // failed state and no old dirty text returns.
    await page.evaluate(() => {
      const form = document.querySelector('[data-testid="commit-lab-form"]') as HTMLFormElement
      const cancel = (e: Event) => e.preventDefault()
      ;(window as unknown as { __nfCancelReset: (e: Event) => void }).__nfCancelReset = cancel
      form.addEventListener('reset', cancel, true)
    })
    await input.click()
    await input.fill('-')
    await page.getByTestId('commit-lab-reset').click()
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveValue('50')
    await expect(input).not.toHaveAttribute('data-editing', '')
    // Removing the cancel lets an unprevented reset clear the boundary.
    await page.evaluate(() => {
      const form = document.querySelector('[data-testid="commit-lab-form"]') as HTMLFormElement
      form.removeEventListener(
        'reset',
        (window as unknown as { __nfCancelReset: (e: Event) => void }).__nfCancelReset,
        true
      )
    })
    await page.getByTestId('commit-lab-reset').click()
    await expect(input).not.toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveValue('50')
    await expect(display).toHaveText('Value: 50')
  })
})
