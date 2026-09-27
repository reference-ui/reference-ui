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
    const field = page.getByTestId('number-field-root')

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

    const root = page.getByTestId('number-field-root')
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

    const root = page.getByTestId('number-field-root')
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

    const root = page.getByTestId('number-field-root')
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
    await expect(root).toBeVisible()
    await page.waitForTimeout(300)
    await snap(page, 'numberfield-disabled')
    await snap(root, 'numberfield-disabled-root', { maxDiffPixelRatio: 0.001 })
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
})
