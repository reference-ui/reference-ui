import { test, expect, snap } from '../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

// Real-paste helpers (probed headless-green on Chromium/Firefox/WebKit
// 2026-09-28): stagePaste copies with focus outside the field — the prep
// blur noops on echoed/in-range drafts — then refocuses; callers pin the
// caret portably (select-all + arrow collapse, never Home) and press
// ControlOrMeta+v.
async function copyText(page: Page, text: string): Promise<void> {
  await page.evaluate(staged => {
    const node = document.createElement('div')
    node.id = 'nf-paste-source'
    node.textContent = staged
    document.body.appendChild(node)
    const range = document.createRange()
    range.selectNodeContents(node)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  }, text)
  await page.keyboard.press('ControlOrMeta+c')
  await page.evaluate(() => {
    document.getElementById('nf-paste-source')?.remove()
    window.getSelection()?.removeAllRanges()
  })
}

async function stagePaste(page: Page, input: Locator, text: string): Promise<void> {
  await input.evaluate(el => (el as HTMLInputElement).blur())
  await copyText(page, text)
  await input.evaluate(el => (el as HTMLInputElement).focus())
}

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

  test('NF-EDIT-04: Clearing requests null once as a live candidate', async ({
    mount,
    page,
  }) => {
    // NFLAST ruling (c) re-pin: the cleared null publishes live; the
    // accepted echo preserves the dirty empty state until commit.
    await mount('components/NumberField/NumberField/StepperFixture')

    const input = page.getByTestId('number-field-input')
    const display = page.getByTestId('number-field-value-display')

    await input.fill('')
    await expect(input).toHaveValue('')
    await expect(input).toHaveAttribute('data-editing', '')
    await expect(display).toHaveText('Numeric Value: None')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('')
    await expect(input).not.toHaveAttribute('data-editing')
    await expect(display).toHaveText('Numeric Value: None')
  })

  test('NF-EDIT-03: Newly parseable live edits request numbers while preserving authored text and caret', async ({
    mount,
    page,
  }) => {
    // NFLAST ruling (c) re-pin of the B-19 repro: true per-keystroke
    // typing into the empty bounded (min 1, max 10) field. The "."
    // survives verbatim (the B-19 fix); parseable meanings publish live.
    await mount('components/NumberField/NumberField/BoundedDecimalFixture')

    const input = page.getByTestId('bounded-decimal-input')
    const display = page.getByTestId('bounded-decimal-display')
    const log = page.getByTestId('bounded-decimal-log')

    await input.click()
    await input.pressSequentially('2.5', { delay: 20 })
    await expect(input).toHaveValue('2.5')
    await expect(display).toHaveText('Decimal Value: 2.5')
    await expect(log).toHaveText('requests: 2')
    await expect(input).toHaveAttribute('data-editing', '')
    const caret = await input.evaluate(el => {
      const target = el as HTMLInputElement
      return [target.selectionStart, target.selectionEnd]
    })
    expect(caret).toEqual([3, 3])
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('2.5')
    await expect(input).not.toHaveAttribute('data-editing')
    await expect(display).toHaveText('Decimal Value: 2.5')
    await expect(log).toHaveText('requests: 2')
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
    // Live meanings publish raw (2, then 2.5); the snap lands at commit.
    await input.pressSequentially('2.5', { delay: 20 })
    await expect(input).toHaveValue('2.5')
    await expect(display).toHaveText('Snap Value: 2.5')
    await expect(log).toHaveText('requests: 2')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('3')
    await expect(display).toHaveText('Snap Value: 3')
    await expect(log).toHaveText('requests: 3')
  })

  test('NF-COMMIT-06: Validate commit should retain accepted invalid numbers without touching native text-input range/step validity', async ({
    mount,
    page,
  }) => {
    // NFLAST ruling (b) re-pin: replaces the W-02 validate-revert title.
    await mount('components/NumberField/NumberField/ValidateFixture')

    const input = page.getByTestId('validate-input')
    const display = page.getByTestId('validate-display')
    const log = page.getByTestId('validate-log')
    const hidden = page.locator('input[type="hidden"]')

    async function nativeValidity() {
      return input.evaluate(el => {
        const target = el as HTMLInputElement
        const validity = target.validity
        return {
          rangeUnderflow: validity.rangeUnderflow,
          rangeOverflow: validity.rangeOverflow,
          stepMismatch: validity.stepMismatch,
          customError: validity.customError,
          message: target.validationMessage,
        }
      })
    }
    const cleanNative = {
      rangeUnderflow: false,
      rangeOverflow: false,
      stepMismatch: false,
      customError: false,
      message: '',
    }

    // The fixture accepts immediately, so every invalid value lands via
    // live request and each Enter is a retaining no-op — which is exactly
    // the freeze's "accepted invalid numbers" path. No commit-request ever
    // fires, so the advisory log stays quiet (advisory itself is proven in
    // unit NF-MATH-13, where the commit path actually requests).
    await expect(input).toHaveValue('5')
    // Off-step mismatch retained with managed invalid state, native clean.
    await input.fill('2.5')
    await expect(display).toHaveText('Validate Value: 2.5')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('2.5')
    await expect(display).toHaveText('Validate Value: 2.5')
    await expect(hidden).toHaveValue('2.5')
    await expect(log).toHaveText('invalid: none')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveAttribute('data-invalid', '')
    expect(await nativeValidity()).toEqual(cleanNative)

    // Overflow retained, never clamped.
    await input.fill('25')
    await expect(display).toHaveText('Validate Value: 25')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('25')
    await expect(display).toHaveText('Validate Value: 25')
    await expect(hidden).toHaveValue('25')
    await expect(log).toHaveText('invalid: none')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(await nativeValidity()).toEqual(cleanNative)

    // Underflow retained, never clamped.
    await input.fill('-5')
    await expect(display).toHaveText('Validate Value: -5')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('-5')
    await expect(display).toHaveText('Validate Value: -5')
    await expect(hidden).toHaveValue('-5')
    await expect(log).toHaveText('invalid: none')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(await nativeValidity()).toEqual(cleanNative)

    // A valid commit clears managed invalid state without advisory noise.
    await input.fill('7')
    await expect(display).toHaveText('Validate Value: 7')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('7')
    await expect(display).toHaveText('Validate Value: 7')
    await expect(hidden).toHaveValue('7')
    await expect(log).toHaveText('invalid: none')
    await expect(input).not.toHaveAttribute('data-invalid')
    await expect(input).not.toHaveAttribute('aria-invalid')
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

    // Typing never fights the formatter: raw keystrokes stay verbatim
    // while their meanings publish live (accepted echoes preserve the
    // buffer); commit only canonicalizes the display.
    await input.fill('')
    await input.pressSequentially('99.99', { delay: 20 })
    await expect(input).toHaveValue('99.99')
    await expect(display).toHaveText('Currency Value: 99.99')
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
    await expect(display).toHaveText('Percent Value: 0.25')
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
    // Live request lands immediately (echo on); the EUR swap replaces
    // dirty text from controlled 999, not the pre-edit 1234.5.
    await expect(log).toHaveText('log: 999')
    await page.getByTestId('format-swap-eur').click()
    await expect(input).toHaveValue('€999.00')
    await expect(input).not.toHaveAttribute('data-editing', '')
    await expect(hidden).toHaveValue('999')
    await expect(log).toHaveText('log: 999')
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
    // Staged programmatically (letters are untypeable since NF-EDIT-02,
    // so the RTL buffer arrives the way autofill/composition would).
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      setter.call(target, '12א')
      target.dispatchEvent(new Event('input', { bubbles: true }))
      target.setSelectionRange(3, 3)
    })
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
    // Echo off while clean: every live request is rejected by the parent —
    // each publishes, nothing sticks, no hidden store forms.
    await page.getByTestId('commit-lab-echo-off').click()
    await input.click()
    for (const text of ['1', '12', '42']) {
      await input.fill(text)
      await expect(input).toHaveValue(text)
      await expect(display).toHaveText('Value: 5')
      await expect(hidden).toHaveValue('5')
    }
    await expect(log).toHaveText('log: 1,12,42')
    // The commit retry derives from the current buffer, still prop-based.
    await page.keyboard.press('Enter')
    await expect(log).toHaveText('log: 1,12,42,42')
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
    // Live 7 lands immediately (echo on); blur then only veto-checks —
    // consumer blur runs with no commit request after it.
    await input.fill('7')
    await expect(log).toHaveText('log: 7')
    await page.getByTestId('commit-lab-outside').click()
    await expect(order).toHaveText('order: request,blur')
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
    // Delayed echo: the live request publishes (hidden stays controlled),
    // blur retries it, and the echo-on retype lands the value live.
    await page.getByTestId('commit-lab-echo-off').click()
    await input.click()
    await input.fill('8')
    await page.getByTestId('commit-lab-outside').click()
    await expect(log).toHaveText('log: 7,8,8')
    await expect(display).toHaveText('Value: 7')
    await expect(hidden).toHaveValue('7')
    await page.getByTestId('commit-lab-echo-on').click()
    await input.click()
    await input.fill('8')
    await page.getByTestId('commit-lab-outside').click()
    await expect(log).toHaveText('log: 7,8,8,8')
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
    // Live 9 lands on fill (echo on); Enter only runs the consumer key
    // handler — the commit itself is a no-op with no second request.
    await input.fill('9')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('commit-lab-order')).toHaveText('order: request,key')
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
    // Autofill travels the live path: the input event publishes
    // immediately (echo on), so the log shows 42 pre-blur.
    await expect(log).toHaveText('log: 42')
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
    // Echo off: live 43 publishes, blur retries it; nothing sticks.
    await expect(log).toHaveText('log: 42,43,43')
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
    // Live 999 lands (echo on); the locale swap de-formats from 999.
    await expect(log).toHaveText('log: 999')
    await input.evaluate(el => {
      ;(window as unknown as { __nfNode: unknown }).__nfNode = el
    })
    await page.getByTestId('format-swap-de').click()
    const expectedDe = await page.evaluate(() =>
      new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(999)
    )
    await expect(input).toHaveValue(expectedDe)
    await expect(input).toHaveAttribute('inputmode', 'numeric')
    await expect(input).not.toHaveAttribute('data-editing', '')
    await expect(input).not.toHaveAttribute('aria-invalid', 'true')
    await expect(hidden).toHaveValue('999')
    await expect(log).toHaveText('log: 999')
    await expect(input).toBeFocused()
    const sameAfterLocale = await input.evaluate(
      el => el === (window as unknown as { __nfNode: unknown }).__nfNode
    )
    expect(sameAfterLocale).toBe(true)
    // Scientific grammar flips inputMode with the same atomic replacement.
    await input.fill('1500')
    await expect(log).toHaveText('log: 999,1500')
    await page.getByTestId('format-swap-scientific').click()
    const expectedSci = await page.evaluate(() =>
      new Intl.NumberFormat('de-DE', { notation: 'scientific' }).format(1500)
    )
    await expect(input).toHaveValue(expectedSci)
    await expect(input).toHaveAttribute('inputmode', 'text')
    await expect(log).toHaveText('log: 999,1500')
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
    // Echo off: live 50 publishes, the blur-first retry re-requests it.
    await expect(log).toHaveText('log: 99,100,99,50,50')
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
    // Echo off: live 8 publishes at fill, the submit click blurs first
    // and retries it, then the submit is pending-blocked.
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: 8')
    await page.getByTestId('commit-lab-submit').click()
    await expect(page.getByTestId('commit-lab-order')).toHaveText('order: request,blur,request')
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: 8,8')
    await expect(page.getByTestId('commit-lab-display')).toHaveText('Value: 5')
    await expect.poll(async () => (await probe()).length).toBe(1)
    expect(await probe()).toEqual([{ prevented: true, qty: '5' }])
    await expect(submitsB).toHaveText('submits: 1')
    await page.getByTestId('commit-lab-submit').click()
    await expect.poll(async () => (await probe()).length).toBe(2)
    await expect(submitsB).toHaveText('submits: 2')
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: 8,8')
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
    // Accepted run: live 50 lands at fill (echo on); the reset click
    // blurs first (veto-check, no retry), reset clears transient.
    await input.click()
    await input.fill('50')
    await page.getByTestId('commit-lab-reset').click()
    await expect(order).toHaveText('order: request,blur')
    await expect(log).toHaveText('log: 50')
    await expect(display).toHaveText('Value: 50')
    await expect(input).toHaveValue('50')
    await expect(input).not.toHaveAttribute('data-editing', '')
    // Rejected run: live 60 publishes, the blur-first retry re-requests
    // it, reset clears pending around authority.
    await page.getByTestId('commit-lab-echo-off').click()
    await input.click()
    await input.fill('60')
    await page.getByTestId('commit-lab-reset').click()
    await expect(log).toHaveText('log: 50,60,60')
    await expect(display).toHaveText('Value: 50')
    await expect(input).toHaveValue('50')
    await expect(hidden).toHaveValue('50')
    // Incomplete run: blur records the boundary, reset clears it.
    await input.click()
    await input.fill('-')
    await page.getByTestId('commit-lab-reset').click()
    await expect(input).toHaveValue('50')
    await expect(input).not.toHaveAttribute('aria-invalid', 'true')
    await expect(log).toHaveText('log: 50,60,60')
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

  test('NF-EDIT-16: Cut, undo, redo, and ranged replacement stay browser-native with requests only for new meanings', async ({
    mount,
    page,
    browserName,
  }) => {
    // Zero command-interception code exists in the engine (PATCHES §9
    // class): cut/undo/redo/select-all reach the input natively and only
    // newly parseable resulting text publishes (live-request rules).
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    const log = page.getByTestId('commit-lab-log')
    const display = page.getByTestId('commit-lab-display')
    await input.click()
    // Select-all + type replaces (click caret is unpinned); Home/End are
    // bound-handled here, so arrows navigate (native, EDIT-06).
    await page.keyboard.press('ControlOrMeta+a')
    await input.pressSequentially('43', { delay: 20 })
    await expect(input).toHaveValue('43')
    await expect(log).toHaveText('log: 4,43')
    await expect(display).toHaveText('Value: 43')
    // Cut all: native empty + live null request.
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+x')
    await expect(input).toHaveValue('')
    await expect(log).toHaveText('log: 4,43,null')
    await expect(display).toHaveText('Value: None')
    // Undo/redo traverse natively on every engine, but WebKit walks two
    // history levels per command (typing-level + cut-level, one input
    // event per level — observed native behavior, probed 2026-09-28)
    // while Chromium/Firefox pop one level. Either way no command is
    // canceled and every newly parseable meaning publishes (EDIT-06
    // per-engine precedent for native-outcome branches).
    const webkitHistory = browserName === 'webkit'
    await page.keyboard.press('ControlOrMeta+z')
    if (webkitHistory) {
      await expect(input).toHaveValue('5')
      await expect(log).toHaveText('log: 4,43,null,43,5')
      await expect(display).toHaveText('Value: 5')
    } else {
      await expect(input).toHaveValue('43')
      await expect(log).toHaveText('log: 4,43,null,43')
      await expect(display).toHaveText('Value: 43')
    }
    // Redo re-clears natively (two levels again on WebKit).
    await page.keyboard.press('ControlOrMeta+Shift+z')
    await expect(input).toHaveValue('')
    const redoLog = webkitHistory ? 'log: 4,43,null,43,5,43,null' : 'log: 4,43,null,43,null'
    await expect(log).toHaveText(redoLog)
    // Ranged replacement over typed text: native splice, one request.
    await input.pressSequentially('123', { delay: 20 })
    await expect(log).toHaveText(`${redoLog},1,12,123`)
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('Shift+ArrowRight')
    await page.keyboard.press('9')
    await expect(input).toHaveValue('923')
    await expect(log).toHaveText(`${redoLog},1,12,123,923`)
    // Localized tokens: cutting inside currency text stays native and
    // only a newly parseable meaning publishes.
    await mount('components/NumberField/NumberField/CurrencyFixture')
    const currency = page.getByTestId('currency-input')
    const currencyDisplay = page.getByTestId('currency-display')
    await currency.click()
    await expect(currency).toHaveValue('$1,234.50')
    // Portable caret-to-start: bare Home is a caret no-op on FF/WebKit
    // macOS builds (DIAG D3A — EDIT-06 pins the platform rule), so
    // select-all + ArrowLeft collapse instead of Home. Same SPEC step:
    // cut the individual currency token.
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('Shift+ArrowRight')
    await page.keyboard.press('ControlOrMeta+x')
    await expect(currency).toHaveValue('1,234.50')
    await expect(currencyDisplay).toHaveText('Currency Value: 1234.5')
    await page.keyboard.press('ControlOrMeta+z')
    await expect(currency).toHaveValue('$1,234.50')
    await expect(currencyDisplay).toHaveText('Currency Value: 1234.5')
  })

  test('NF-EDIT-15: Deletion around grouping and affixes preserves a correct editable buffer', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    const log = page.getByTestId('commit-lab-log')
    const display = page.getByTestId('commit-lab-display')
    const caret = () =>
      input.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
    await input.click()
    await input.fill('1,024')
    await expect(log).toHaveText('log: 1024')
    await expect(display).toHaveText('Value: 1024')
    // Deleting the group separator keeps the native buffer; the meaning
    // is unchanged, so no new request publishes.
    await expect(caret()).resolves.toEqual([5, 5])
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('Backspace')
    await expect(input).toHaveValue('1024')
    await expect(caret()).resolves.toEqual([1, 1])
    await expect(log).toHaveText('log: 1024')
    // Deleting the first digit orphans the head separator: the partial
    // stays natively editable with no spurious request, and commit takes
    // the unambiguous remainder.
    await input.fill('1,024')
    await expect(log).toHaveText('log: 1024')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('Shift+ArrowRight')
    await page.keyboard.press('Backspace')
    await expect(input).toHaveValue(',024')
    await expect(caret()).resolves.toEqual([0, 0])
    await expect(log).toHaveText('log: 1024')
    await page.keyboard.press('Enter')
    await expect(log).toHaveText('log: 1024,24')
    await expect(display).toHaveText('Value: 24')
    await expect(input).toHaveValue('24')
    // Affix and decimal tokens delete natively; only new meanings publish.
    await mount('components/NumberField/NumberField/CurrencyFixture')
    const currency = page.getByTestId('currency-input')
    const currencyDisplay = page.getByTestId('currency-display')
    await currency.click()
    // Portable caret-to-start (DIAG D3A: bare Home is a caret no-op on
    // FF/WebKit macOS builds) — select-all + ArrowLeft collapse, then
    // select the individual currency token. Same SPEC step as Home.
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('Shift+ArrowRight')
    await page.keyboard.press('Backspace')
    await expect(currency).toHaveValue('1,234.50')
    await expect(currencyDisplay).toHaveText('Currency Value: 1234.5')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Backspace')
    await expect(currency).toHaveValue('1234.50')
    await expect(currencyDisplay).toHaveText('Currency Value: 1234.5')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Backspace')
    await expect(currency).toHaveValue('123450')
    await expect(currencyDisplay).toHaveText('Currency Value: 123450')
  })

  test('NF-EDIT-12: A valid synthetic composition result parses once and an invalid result restores pre-composition text', async ({
    mount,
    page,
  }) => {
    const lab = await mount('components/NumberField/NumberField/CompositionFixture')
    const input = page.getByTestId('composition-input')
    const log = page.getByTestId('composition-log')
    const display = page.getByTestId('composition-display')
    await input.click()
    // Valid localized final: compositionend publishes nothing itself,
    // the matching post-end input publishes no duplicate, and the blur
    // boundary requests the staged final exactly once.
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      target.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, cancelable: true }))
      setter.call(target, '١٢')
      target.dispatchEvent(new Event('input', { bubbles: true }))
      target.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, cancelable: true }))
    })
    await expect(log).toHaveText('log: none')
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      setter.call(target, '١٢')
      target.dispatchEvent(new Event('input', { bubbles: true }))
    })
    // Matching post-end input: no duplicate request.
    await expect(log).toHaveText('log: none')
    await page.getByTestId('composition-outside').click()
    await expect(log).toHaveText('log: 12')
    await expect(display).toHaveText('Value: 12')
    // Invalid prose final restores pre-composition text at compositionend
    // with no request and no stale text at the next boundary either.
    await lab.unmount()
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const inputB = page.getByTestId('commit-lab-input')
    await inputB.click()
    await inputB.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      target.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, cancelable: true }))
      setter.call(target, 'ni3hao')
      target.dispatchEvent(new Event('input', { bubbles: true }))
      target.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, cancelable: true }))
    })
    await expect(inputB).toHaveValue('5')
    await expect(inputB).not.toHaveAttribute('data-editing', '')
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: none')
    await page.getByTestId('commit-lab-outside').click()
    await expect(page.getByTestId('commit-lab-log')).toHaveText('log: none')
    await expect(page.getByTestId('commit-lab-display')).toHaveText('Value: 5')
  })

  test('NF-EDIT-17: A controlled value change during active composition invalidates the session and ignores stale fallout', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    const log = page.getByTestId('commit-lab-log')
    const display = page.getByTestId('commit-lab-display')
    const caret = () =>
      input.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
    await input.click()
    await page.keyboard.press('ControlOrMeta+a')
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      target.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, cancelable: true }))
      setter.call(target, 'ni3hao')
      target.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await expect(input).toHaveValue('ni3hao')
    await expect(log).toHaveText('log: none')
    // Programmatic replacement lands without blur: latest formatted text,
    // editing cleared, selection at the formatted end.
    await page.getByTestId('commit-lab-set-99').click()
    await expect(input).toHaveValue('99')
    await expect(input).not.toHaveAttribute('data-editing', '')
    await expect(caret()).resolves.toEqual([2, 2])
    await expect(display).toHaveText('Value: 99')
    await expect(log).toHaveText('log: none')
    await expect(input).toBeFocused()
    // Stale compositionend + matching input fallout: ignored, DOM text
    // reverts to controlled, zero callback.
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      target.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, cancelable: true }))
      setter.call(target, 'ni3hao!')
      target.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await expect(input).toHaveValue('99')
    await expect(log).toHaveText('log: none')
    await expect(display).toHaveText('Value: 99')
    await page.getByTestId('commit-lab-outside').click()
    await expect(log).toHaveText('log: none')
  })

  test('NF-EDIT-18: A locale or effective format change during active composition replaces from latest controlled state and ignores stale fallout', async ({
    mount,
    page,
  }) => {
    // One fresh run per replacement kind: locale, currency, notation,
    // numbering system. Each run composes prose over a selection, swaps
    // without blur, then feeds stale end/input fallout.
    const runs: Array<{
      swap: string
      expected: { formatOptions: Intl.NumberFormatOptions; locale: string }
      inputMode: string
    }> = [
      {
        swap: 'format-swap-de',
        expected: { formatOptions: { style: 'currency', currency: 'USD' }, locale: 'de-DE' },
        inputMode: 'numeric',
      },
      {
        swap: 'format-swap-eur',
        expected: { formatOptions: { style: 'currency', currency: 'EUR' }, locale: 'en-US' },
        inputMode: 'numeric',
      },
      {
        swap: 'format-swap-scientific',
        expected: { formatOptions: { notation: 'scientific' }, locale: 'en-US' },
        inputMode: 'text',
      },
      {
        swap: 'format-swap-nu-arab',
        expected: {
          formatOptions: { style: 'currency', currency: 'USD', numberingSystem: 'arab' },
          locale: 'en-US',
        },
        inputMode: 'numeric',
      },
    ]
    for (const run of runs) {
      const lab = await mount('components/NumberField/NumberField/FormatSwapFixture')
      const input = page.getByTestId('format-swap-input')
      const log = page.getByTestId('format-swap-log')
      const expectedText = await page.evaluate(
        ({ value, locale, formatOptions }) =>
          new Intl.NumberFormat(locale, formatOptions).format(value),
        { value: 1234.5, locale: run.expected.locale, formatOptions: run.expected.formatOptions }
      )
      await input.click()
      await page.keyboard.press('ControlOrMeta+a')
      await input.evaluate(el => {
        const target = el as HTMLInputElement
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
        target.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, cancelable: true }))
        setter.call(target, 'ni3hao')
        target.dispatchEvent(new Event('input', { bubbles: true }))
      })
      await expect(input).toHaveValue('ni3hao')
      await page.getByTestId(run.swap).click()
      // Coherent replacement: new text, grammar inputMode, selection at
      // the formatted end, editing cleared, focus kept, zero callback.
      await expect(input).toHaveValue(expectedText)
      await expect(input).toHaveAttribute('inputmode', run.inputMode)
      await expect(input).not.toHaveAttribute('data-editing', '')
      await expect(input).toBeFocused()
      await expect(log).toHaveText('log: none')
      const caret = await input.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
      expect(caret).toEqual([expectedText.length, expectedText.length])
      // Stale fallout never restores old grammar or publishes.
      await input.evaluate(el => {
        const target = el as HTMLInputElement
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
        target.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, cancelable: true }))
        setter.call(target, 'ni3hao!')
        target.dispatchEvent(new Event('input', { bubbles: true }))
      })
      await expect(input).toHaveValue(expectedText)
      await expect(log).toHaveText('log: none')
      await lab.unmount()
    }
  })

  test('NF-EDIT-02: Valid partial edits remain visible while impossible ordinary insertions are canceled', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    const log = page.getByTestId('commit-lab-log')
    const display = page.getByTestId('commit-lab-display')
    const caret = () =>
      input.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
    // Sign partial stages verbatim with no callback; a letter into it
    // cancels with text, caret, and dirty state intact.
    await input.click()
    await page.keyboard.press('ControlOrMeta+a')
    await input.pressSequentially('-', { delay: 20 })
    await expect(input).toHaveValue('-')
    await expect(caret()).resolves.toEqual([1, 1])
    await expect(input).toHaveAttribute('data-editing', '')
    await expect(log).toHaveText('log: none')
    await input.pressSequentially('a', { delay: 20 })
    await expect(input).toHaveValue('-')
    await expect(caret()).resolves.toEqual([1, 1])
    await expect(input).toHaveAttribute('data-editing', '')
    await expect(log).toHaveText('log: none')
    await expect(display).toHaveText('Value: 5')
    // Decimal partial completes and requests; a duplicate dot cancels.
    await page.keyboard.press('ControlOrMeta+a')
    await input.pressSequentially('1.5', { delay: 20 })
    await expect(input).toHaveValue('1.5')
    await expect(log).toHaveText('log: 1,1.5')
    await input.pressSequentially('.', { delay: 20 })
    await expect(input).toHaveValue('1.5')
    await expect(caret()).resolves.toEqual([3, 3])
    await expect(log).toHaveText('log: 1,1.5')
    // A second sign at the head cancels; the staged buffer persists.
    await page.keyboard.press('ControlOrMeta+a')
    await input.pressSequentially('-5', { delay: 20 })
    await expect(input).toHaveValue('-5')
    await expect(log).toHaveText('log: 1,1.5,-5')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ArrowLeft')
    await input.pressSequentially('-', { delay: 20 })
    await expect(input).toHaveValue('-5')
    await expect(caret()).resolves.toEqual([0, 0])
    await expect(input).toHaveAttribute('data-editing', '')
    await expect(log).toHaveText('log: 1,1.5,-5')
    // Localized partials (de-DE comma decimal) stage; duplicates and
    // letters cancel; completion requests.
    await mount('components/NumberField/NumberField/NoGroupingFixture')
    const deInput = page.getByTestId('no-grouping-input')
    const deLog = page.getByTestId('no-grouping-log')
    const deCaret = () =>
      deInput.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
    await page.getByTestId('no-grouping-de').click()
    await deInput.click()
    await deInput.pressSequentially(',', { delay: 20 })
    await expect(deInput).toHaveValue(',')
    await expect(deCaret()).resolves.toEqual([1, 1])
    await expect(deInput).toHaveAttribute('data-editing', '')
    await expect(deLog).toHaveText('log: none')
    await deInput.pressSequentially(',', { delay: 20 })
    await expect(deInput).toHaveValue(',')
    await expect(deCaret()).resolves.toEqual([1, 1])
    await deInput.pressSequentially('a', { delay: 20 })
    await expect(deInput).toHaveValue(',')
    await expect(deLog).toHaveText('log: none')
    await deInput.pressSequentially('5', { delay: 20 })
    await expect(deInput).toHaveValue(',5')
    await expect(deLog).toHaveText('log: 0.5')
  })

  test('NF-EDIT-08: Valid paste splices at the current selection and retains the resulting caret', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    const log = page.getByTestId('commit-lab-log')
    const display = page.getByTestId('commit-lab-display')
    const caret = () =>
      input.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
    // Full replacement, then end / middle / ranged insertions — each
    // paste lands natively with the caret after the payload and exactly
    // one parseable request.
    await stagePaste(page, input, '4')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('4')
    await expect(caret()).resolves.toEqual([1, 1])
    await expect(log).toHaveText('log: 4')
    await stagePaste(page, input, '2')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('42')
    await expect(caret()).resolves.toEqual([2, 2])
    await expect(log).toHaveText('log: 4,42')
    await stagePaste(page, input, '.')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('4.2')
    await expect(caret()).resolves.toEqual([2, 2])
    await expect(log).toHaveText('log: 4,42,4.2')
    await stagePaste(page, input, '5')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('Shift+ArrowRight')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('4.5')
    await expect(caret()).resolves.toEqual([3, 3])
    await expect(log).toHaveText('log: 4,42,4.2,4.5')
    // Supported localized digits paste and request identically
    // (ar-EG: ASCII live spelling formats to Eastern Arabic at commit).
    await mount('components/NumberField/NumberField/CompositionFixture')
    const arInput = page.getByTestId('composition-input')
    const arLog = page.getByTestId('composition-log')
    const arDisplay = page.getByTestId('composition-display')
    const arCaret = () =>
      arInput.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
    await stagePaste(page, arInput, '١٢')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(arInput).toHaveValue('١٢')
    await expect(arCaret()).resolves.toEqual([2, 2])
    await expect(arLog).toHaveText('log: 12')
    await expect(arDisplay).toHaveText('Value: 12')
    await stagePaste(page, arInput, '34')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(arInput).toHaveValue('34')
    await expect(arLog).toHaveText('log: 12,34')
    // Locale formatting applies only at commit — the live buffer keeps
    // the pasted spelling until the boundary.
    await page.getByTestId('composition-outside').click()
    await expect(arInput).toHaveValue('٣٤')
    await expect(arDisplay).toHaveText('Value: 34')
    // Currency: the pasted plain digits stay ungrouped live and format
    // at commit.
    await mount('components/NumberField/NumberField/CurrencyFixture')
    const currency = page.getByTestId('currency-input')
    const currencyDisplay = page.getByTestId('currency-display')
    await stagePaste(page, currency, '2500')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(currency).toHaveValue('2500')
    await expect(currencyDisplay).toHaveText('Currency Value: 2500')
    await page.keyboard.press('Enter')
    await expect(currency).toHaveValue('$2,500.00')
    await expect(currencyDisplay).toHaveText('Currency Value: 2500')
  })

  test('NF-EDIT-09: Invalid paste leaves text, selection, controlled state, and callbacks unchanged', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CommitLabFixture')
    const input = page.getByTestId('commit-lab-input')
    const log = page.getByTestId('commit-lab-log')
    const display = page.getByTestId('commit-lab-display')
    const order = page.getByTestId('commit-lab-order')
    const caret = () =>
      input.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
    // Letters at a pinned caret: prevented, zero mutation.
    await stagePaste(page, input, 'abc')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('5')
    await expect(caret()).resolves.toEqual([0, 0])
    await expect(log).toHaveText('log: none')
    await expect(display).toHaveText('Value: 5')
    // Malformed grouping over a range: the range selection survives.
    await stagePaste(page, input, '1,0,0')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('5')
    await expect(caret()).resolves.toEqual([0, 1])
    await expect(log).toHaveText('log: none')
    // Duplicate decimal: set up a valid decimal, then reject the dot.
    await stagePaste(page, input, '1.5')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('1.5')
    await expect(log).toHaveText('log: 1.5')
    await stagePaste(page, input, '.')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('1.5')
    await expect(caret()).resolves.toEqual([3, 3])
    await expect(log).toHaveText('log: 1.5')
    await expect(display).toHaveText('Value: 1.5')
    // Overflow: nonfinite results never cross the callback.
    await stagePaste(page, input, '1e999')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('1.5')
    await expect(caret()).resolves.toEqual([0, 3])
    await expect(log).toHaveText('log: 1.5')
    // Foreign-script digits reject like letters under a Latin locale.
    await stagePaste(page, input, '١٢')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('1.5')
    await expect(caret()).resolves.toEqual([0, 3])
    await expect(log).toHaveText('log: 1.5')
    // Consumer paste observation precedes every prevention: all six
    // pastes logged 'paste' while only the valid setup paste (3rd)
    // produced a 'request' — every invalid paste was observed, then
    // stopped with no request after it. (Prep arrows/select-all also log
    // 'key', so the order is asserted structurally, not verbatim.)
    const entries = ((await order.textContent()) ?? '')
      .replace('order: ', '')
      .split(',')
      .filter(e => e === 'paste' || e === 'request')
    expect(entries.filter(e => e === 'paste')).toHaveLength(6)
    expect(entries.filter(e => e === 'request')).toHaveLength(1)
    expect(entries).toEqual(['paste', 'paste', 'paste', 'request', 'paste', 'paste', 'paste'])
    // Second sign + conflicting affix on the unbounded currency field.
    await mount('components/NumberField/NumberField/CurrencyFixture')
    const currency = page.getByTestId('currency-input')
    const currencyDisplay = page.getByTestId('currency-display')
    const currencyCaret = () =>
      currency.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
    await stagePaste(page, currency, '-5')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(currency).toHaveValue('-5')
    await expect(currencyDisplay).toHaveText('Currency Value: -5')
    // (The prep blur commits the setup draft, so the field shows the
    // formatted '-$5.00' from here on — prevention still holds.)
    await stagePaste(page, currency, '-')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(currency).toHaveValue('-$5.00')
    await expect(currencyCaret()).resolves.toEqual([0, 0])
    await expect(currencyDisplay).toHaveText('Currency Value: -5')
    await stagePaste(page, currency, '€9')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(currency).toHaveValue('-$5.00')
    await expect(currencyCaret()).resolves.toEqual([0, 6])
    await expect(currencyDisplay).toHaveText('Currency Value: -5')
  })

  test('NF-PARSE-07: Disabling grouping removes pasted group tokens without changing the number or caret model', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/NoGroupingFixture')
    const input = page.getByTestId('no-grouping-input')
    const log = page.getByTestId('no-grouping-log')
    const display = page.getByTestId('no-grouping-display')
    const caret = () =>
      input.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
    // US grouped form: separators strip, the number holds, the caret
    // lands after the stripped payload.
    await stagePaste(page, input, '1,000')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('1000')
    await expect(caret()).resolves.toEqual([4, 4])
    await expect(log).toHaveText('log: 1000')
    await expect(display).toHaveText('Value: 1000')
    // Committed display stays ungrouped.
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('1000')
    await expect(display).toHaveText('Value: 1000')
    // German grouped form under de-DE: the dot strips (never a decimal).
    await page.getByTestId('no-grouping-de').click()
    await expect(input).toHaveValue('1000')
    await stagePaste(page, input, '2.500')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('2500')
    await expect(caret()).resolves.toEqual([4, 4])
    await expect(log).toHaveText('log: 1000,2500')
    await expect(display).toHaveText('Value: 2500')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('2500')
    await expect(display).toHaveText('Value: 2500')
  })

  test('NF-COMP-02: A localized currency NumberField composes precision, non-Latin input, dirty submit, and authored labels', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CompCurrencyFixture')
    const input = page.getByTestId('comp-currency-input')
    const log = page.getByTestId('comp-currency-log')
    const display = page.getByTestId('comp-currency-display')
    await expect(input).toHaveValue('$12.50')
    await expect(input).toHaveAttribute('aria-label', 'Amount')
    // Paste a precise value, then step the 0.05 lattice.
    await stagePaste(page, input, '13.75')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('13.75')
    await expect(log).toHaveText('log: 13.75')
    await page.getByTestId('comp-currency-inc').click()
    await expect(log).toHaveText('log: 13.75,13.8')
    await expect(input).toHaveValue('$13.80')
    // German round-trip: localized punctuation pastes and requests.
    await page.getByTestId('comp-currency-de').click()
    const deText = await page.evaluate(
      () => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(13.8)
    )
    await expect(input).toHaveValue(deText)
    await stagePaste(page, input, '10,25 $')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('10,25 $')
    await expect(log).toHaveText('log: 13.75,13.8,10.25')
    // Arabic round-trip: non-Latin digits paste and request.
    await page.getByTestId('comp-currency-ar').click()
    const arText = await page.evaluate(
      () => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'USD' }).format(10.25)
    )
    await expect(input).toHaveValue(arText)
    await stagePaste(page, input, '١٢٫٥٠')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('١٢٫٥٠')
    await expect(log).toHaveText('log: 13.75,13.8,10.25,12.5')
    // Dirty submit: the pasted value is still uncommitted text, and the
    // form serializes the canonical number.
    await expect(input).toHaveAttribute('data-editing', '')
    await stagePaste(page, input, '٩٩٫٩٩')
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.press('ControlOrMeta+v')
    await expect(input).toHaveValue('٩٩٫٩٩')
    await expect(log).toHaveText('log: 13.75,13.8,10.25,12.5,99.99')
    await page.getByTestId('comp-currency-submit').click()
    await expect(page.getByTestId('comp-currency-payload')).toHaveText('payload: amount=99.99')
    await expect(display).toHaveText('Value: 99.99')
    // Authored labels survive every locale swap.
    await expect(input).toHaveAttribute('aria-label', 'Amount')
    await expect(page.getByTestId('comp-currency-dec')).toHaveAttribute('aria-label', 'Decrease amount')
    await expect(page.getByTestId('comp-currency-inc')).toHaveAttribute('aria-label', 'Increase amount')
  })

  test('NF-EDIT-07: Focused formatting replacements preserve the caret by logical digit with a documented end fallback', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CaretLabFixture')
    const input = page.getByTestId('caret-input')
    const currency = page.getByTestId('caret-currency-input')
    const percent = page.getByTestId('caret-percent-input')
    const caretOf = (target: typeof input) => () =>
      target.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
    const caret = caretOf(input)
    const place = (target: typeof input, start: number, end: number) =>
      target.evaluate(
        (el, [s, e]) => (el as HTMLInputElement).setSelectionRange(s, e),
        [start, end] as [number, number]
      )
    await expect(input).toHaveValue('1,234')
    // Start anchor: no preceding digit stays at text start.
    await input.click()
    await place(input, 0, 0)
    await page.getByTestId('caret-set-12345').click()
    await expect(input).toHaveValue('12,345')
    await expect(caret()).resolves.toEqual([0, 0])
    await expect(input).toBeFocused()
    // Middle insertion across a shifted group separator: 2 digits before
    // stays after the 2nd digit.
    await page.getByTestId('caret-set-1234').click()
    await expect(input).toHaveValue('1,234')
    await place(input, 3, 3)
    await page.getByTestId('caret-set-12345').click()
    await expect(input).toHaveValue('12,345')
    await expect(caret()).resolves.toEqual([2, 2])
    // Deeper middle: 3 digits before lands after the 3rd digit.
    await page.getByTestId('caret-set-1234').click()
    await place(input, 4, 4)
    await page.getByTestId('caret-set-12345').click()
    await expect(input).toHaveValue('12,345')
    await expect(caret()).resolves.toEqual([4, 4])
    // Ranged logical selection: each edge follows its own digit count.
    await page.getByTestId('caret-set-1234').click()
    await place(input, 1, 4)
    await page.getByTestId('caret-set-12345').click()
    await expect(input).toHaveValue('12,345')
    await expect(caret()).resolves.toEqual([1, 4])
    // Deletion past the digit supply clamps to the documented end fallback.
    await place(input, 6, 6)
    await page.getByTestId('caret-set-123').click()
    await expect(input).toHaveValue('123')
    await expect(caret()).resolves.toEqual([3, 3])
    // Currency prefix: end-of-cents follows its 6 digits, not the new end.
    await expect(currency).toHaveValue('$1,234.50')
    const currencyCaret = caretOf(currency)
    await currency.click()
    await place(currency, 9, 9)
    await page.getByTestId('caret-currency-set').click()
    await expect(currency).toHaveValue('$12,345.67')
    await expect(currencyCaret()).resolves.toEqual([9, 9])
    await expect(currency).toBeFocused()
    // Currency start anchors before the prefix.
    await page.getByTestId('caret-currency-reset').click()
    await expect(currency).toHaveValue('$1,234.50')
    await place(currency, 0, 0)
    await page.getByTestId('caret-currency-set').click()
    await expect(currency).toHaveValue('$12,345.67')
    await expect(currencyCaret()).resolves.toEqual([0, 0])
    // Percent suffix: end clamps when the digit supply shrinks.
    await expect(percent).toHaveValue('13%')
    const percentCaret = caretOf(percent)
    await percent.click()
    await place(percent, 3, 3)
    await page.getByTestId('caret-percent-set').click()
    await expect(percent).toHaveValue('5%')
    await expect(percentCaret()).resolves.toEqual([2, 2])
    await expect(percent).toBeFocused()
    await page.getByTestId('caret-percent-reset').click()
    await expect(percent).toHaveValue('13%')
    await place(percent, 0, 0)
    await page.getByTestId('caret-percent-set').click()
    await expect(percent).toHaveValue('5%')
    await expect(percentCaret()).resolves.toEqual([0, 0])
  })

  test('NF-DYNAMIC-05: Interactive replacement cancels pending key, repeat, composition, and failed-submit work', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/NumberField/NumberField/DynamicFixture')
    const input = page.getByTestId('dynamic-input')
    const inc = page.getByTestId('dynamic-inc')
    const log = page.getByTestId('dynamic-log')
    const display = page.getByTestId('dynamic-display')
    const submits = page.getByTestId('dynamic-submits')
    // Programmatic toggle clicks: the mouse stays held on the stepper, so
    // only the replacement — never a drag/leave — ends the session.
    const flip = (id: string) =>
      page.getByTestId(id).evaluate(el => (el as HTMLElement).click())
    const hold = async (target: typeof inc = inc) => {
      const box = await target.boundingBox()
      expect(box).not.toBeNull()
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
      await page.mouse.down()
    }
    const activeTag = () => page.evaluate(() => document.activeElement?.tagName ?? 'NONE')
    // V1: disable mid-hold ends the repeat; the stale release never steps;
    // the disabled input blurs natively (body) and stays there — the
    // engine never refocuses; a fresh press steps.
    await hold()
    await expect(log).toHaveText('log: 6')
    await expect(input).toBeFocused()
    await flip('dynamic-toggle-disabled')
    await expect(inc).toBeDisabled()
    await page.waitForTimeout(700)
    await expect(log).toHaveText('log: 6')
    await expect(activeTag()).resolves.toBe('BODY')
    await page.mouse.up()
    await expect(log).toHaveText('log: 6')
    await flip('dynamic-toggle-disabled')
    await expect(inc).not.toBeDisabled()
    await expect(activeTag()).resolves.toBe('BODY')
    await inc.click()
    await expect(log).toHaveText('log: 6,7')
    // V2: read-only mid-hold ends the repeat identically, but the
    // focusable input keeps native focus throughout.
    await hold()
    await expect(log).toHaveText('log: 6,7,8')
    await expect(input).toBeFocused()
    await flip('dynamic-toggle-readonly')
    await page.waitForTimeout(700)
    await expect(log).toHaveText('log: 6,7,8')
    await expect(input).toBeFocused()
    await page.mouse.up()
    await expect(log).toHaveText('log: 6,7,8')
    await flip('dynamic-toggle-readonly')
    await inc.click()
    await expect(log).toHaveText('log: 6,7,8,9')
    // V3: stepper removal mid-hold ends the session; re-added steppers need
    // a fresh press.
    await hold()
    await expect(log).toHaveText('log: 6,7,8,9,10')
    await flip('dynamic-toggle-steppers')
    await expect(inc).toHaveCount(0)
    await page.waitForTimeout(700)
    await expect(log).toHaveText('log: 6,7,8,9,10')
    await page.mouse.up()
    await expect(log).toHaveText('log: 6,7,8,9,10')
    await flip('dynamic-toggle-steppers')
    await expect(inc).toHaveCount(1)
    await inc.click()
    await expect(log).toHaveText('log: 6,7,8,9,10,11')
    // V4: owner-root replacement mid-hold remounts clean; focus follows
    // native removal rules (body); fresh edits step from control.
    await hold()
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12')
    await flip('dynamic-toggle-owner')
    await expect(page.getByTestId('dynamic-portal-host').locator('[data-testid="dynamic-field"]')).toHaveCount(1)
    await page.waitForTimeout(700)
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12')
    await page.mouse.up()
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12')
    await expect(activeTag()).resolves.toBe('BODY')
    await expect(input).toHaveValue('12')
    await flip('dynamic-toggle-owner')
    await inc.click()
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12,13')
    // V5: disable mid-composition cancels the suspension; focus follows
    // the native rule (body); the stale end is ignored; a fresh edit
    // publishes immediately after re-enable. Whether disable COMMITS is
    // engine-defined (probed): Chromium never delivers disable-blur to
    // React onBlur, so the draft freezes staged; Firefox/WebKit deliver
    // it, so the ordinary blur boundary commits (invalid reverts + failed
    // boundary, cleared by the fresh edit below).
    await input.click()
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      target.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, cancelable: true }))
      setter.call(target, 'ni3hao')
      target.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await expect(input).toHaveValue('ni3hao')
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12,13')
    await flip('dynamic-toggle-disabled')
    // Focus settles asynchronously on WebKit (V1's hold-wait covers the
    // same landing); Chromium/Firefox move synchronously.
    await page.waitForTimeout(300)
    await expect(activeTag()).resolves.toBe('BODY')
    const frozenDraft = browserName === 'chromium'
    await expect(input).toHaveValue(frozenDraft ? 'ni3hao' : '13')
    if (frozenDraft) {
      await expect(input).toHaveAttribute('data-editing', '')
    } else {
      await expect(input).not.toHaveAttribute('data-editing', '')
    }
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12,13')
    await input.evaluate(el => {
      el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, cancelable: true }))
    })
    await expect(input).toHaveValue(frozenDraft ? 'ni3hao' : '13')
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12,13')
    await flip('dynamic-toggle-disabled')
    await input.fill('42')
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12,13,42')
    // V6: key repeats are gated per event; a disabled repeat never steps.
    await input.click()
    await page.keyboard.press('ArrowUp')
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12,13,42,43')
    await flip('dynamic-toggle-disabled')
    await input.evaluate(el => {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }))
    })
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12,13,42,43')
    await flip('dynamic-toggle-disabled')
    await input.click()
    await page.keyboard.press('ArrowUp')
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12,13,42,43,44')
    // V7: authoritative replacement clears failed-submit work; submit flows.
    // Staged programmatically: fill() routes through the EDIT-02 typed
    // gate, so letters must bypass beforeinput like EDIT-17 staging.
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      setter.call(target, 'abc')
      target.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await expect(input).toHaveValue('abc')
    await page.getByTestId('dynamic-outside').click()
    await expect(input).toHaveValue('44')
    // FORM-11 probe pattern: the engine listener runs first, so the
    // probe's defaultPrevented reflects blocking (the fixture counts
    // delivered events either way).
    await page.evaluate(() => {
      const form = document.querySelector('[data-testid="dynamic-form"]') as HTMLFormElement
      ;(window as unknown as { __nfDynSubmits: boolean[] }).__nfDynSubmits = []
      form.addEventListener('submit', e => {
        ;(window as unknown as { __nfDynSubmits: boolean[] }).__nfDynSubmits.push(e.defaultPrevented)
      })
    })
    const preventedFlags = () =>
      page.evaluate(() => (window as unknown as { __nfDynSubmits: boolean[] }).__nfDynSubmits)
    await page.getByTestId('dynamic-submit').click()
    await expect(preventedFlags()).resolves.toEqual([true])
    await page.getByTestId('dynamic-set-99').click()
    await expect(display).toHaveText('Value: 99')
    await page.getByTestId('dynamic-submit').click()
    await expect(preventedFlags()).resolves.toEqual([true, false])
    // V8: authoritative replacement mid-hold ends the repeat; the stale
    // release click is suppressed; only a fresh press steps.
    const dec = page.getByTestId('dynamic-dec')
    await hold(dec)
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12,13,42,43,44,98')
    await flip('dynamic-set-99')
    await expect(display).toHaveText('Value: 99')
    await page.waitForTimeout(700)
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12,13,42,43,44,98')
    await page.mouse.up()
    await expect(log).toHaveText('log: 6,7,8,9,10,11,12,13,42,43,44,98')
    await inc.click()
    await expect(display).toHaveText('Value: 100')
  })

  test('NF-ENV-06: Open ShadowRoot operation scopes focus, IDs, listeners, and same-root forms to the owner root', async ({
    mount,
    page,
  }) => {
    // Console spy attaches before mount; the light-DOM calibration
    // stepper (unresolvable labelledby) proves the spy hears NumberField
    // diagnostics, so the shadow silence below is meaningful.
    const errors: string[] = []
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await mount('components/NumberField/NumberField/ShadowFixture')
    const qty = page.getByTestId('shadow-qty-input')
    const price = page.getByTestId('shadow-price-input')
    const qtyLog = page.getByTestId('shadow-qty-log')
    const priceLog = page.getByTestId('shadow-price-log')
    const shadowActiveTestId = () =>
      page.evaluate(() => {
        const host = document.querySelector('[data-testid="shadow-host"]')
        const active = host?.shadowRoot?.activeElement as HTMLElement | null
        return active?.getAttribute('data-testid') ?? active?.tagName ?? 'NONE'
      })
    // Edit + step both shadow fields through composed events.
    await qty.fill('7')
    await expect(qtyLog).toHaveText('log: 7')
    await page.getByTestId('shadow-qty-inc').click()
    await expect(qtyLog).toHaveText('log: 7,8')
    await price.fill('12')
    await expect(priceLog).toHaveText('log: 12')
    // Stepper labelledby resolves in shadow (a document-global lookup
    // finds no target and renders nothing): the stepper exists + steps.
    const priceInc = page.getByTestId('shadow-price-inc')
    await expect(priceInc).toHaveCount(1)
    await priceInc.click()
    await expect(priceLog).toHaveText('log: 12,13')
    // Native shadow focus semantics: the shadow root owns the input,
    // the document only sees the host.
    await qty.click()
    await expect(shadowActiveTestId()).resolves.toBe('shadow-qty-input')
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.tagName ?? 'NONE'))
      .toBe('DIV')
    // Input labelledby resolves in shadow: no unnamed-Input diagnostic
    // fires for the shadow-only target; the calibration diagnostic lands.
    await expect
      .poll(() => errors.filter(e => e.includes('does not resolve')).length)
      .toBe(1)
    expect(errors.filter(e => e.includes('has no accessible name'))).toEqual([])
    expect(errors.filter(e => e.includes('collides across independent roots'))).toEqual([])
    await expect(page.getByTestId('shadow-cal-inc')).toHaveCount(0)
    // Same-root form: canonical payload from both shadow fields.
    await page.getByTestId('shadow-submit').click()
    await expect(page.getByTestId('shadow-payload')).toHaveText('payload: qty=8,price=13')
    // Same-root reset: staged invalid text reverts to control, no request.
    await qty.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      setter.call(target, 'abc')
      target.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await expect(qty).toHaveValue('abc')
    await page.getByTestId('shadow-reset').click()
    await expect(qty).toHaveValue('8')
    await expect(qtyLog).toHaveText('log: 7,8')
    // Shadow IDs are invisible to document-global lookup.
    const docLookup = await page.evaluate(() => ({
      span: document.getElementById('shadow-qty-name') !== null,
      input: document.getElementById(
        (
          document
            .querySelector('[data-testid="shadow-host"]')
            ?.shadowRoot?.querySelector('[data-testid="shadow-qty-input"]') as HTMLInputElement | null
        )?.id ?? 'shadow-missing-id'
      ) !== null,
    }))
    expect(docLookup).toEqual({ span: false, input: false })
  })

  test('NF-COMP-04: A scientific unit NumberField composes validate mode, RTL, Shadow DOM, and programmatic replacement without custom parsing', async ({
    mount,
    page,
  }) => {
    await mount('components/NumberField/NumberField/CompScienceFixture')
    const input = page.getByTestId('sci-input')
    const log = page.getByTestId('sci-log')
    const display = page.getByTestId('sci-display')
    // Every expectation derives from platform Intl in-page — the spec
    // imports no engine parsing or formatting.
    const fmt = (locale: string, value: number) =>
      page.evaluate(
        ([l, v]) =>
          new Intl.NumberFormat(l, { style: 'unit', unit: 'meter', notation: 'scientific' }).format(v),
        [locale, value] as [string, number]
      )
    await expect(input).toHaveValue(await fmt('en-US', 12000))
    // RTL inheritance changes presentation, never step direction.
    await expect(page.getByTestId('sci-rtl')).toHaveAttribute('dir', 'rtl')
    const direction = await input.evaluate(el => getComputedStyle(el).direction)
    expect(direction).toBe('rtl')
    await page.getByTestId('sci-inc').click()
    await expect(log).toHaveText('log: 12005')
    await expect(display).toHaveText('Value: 12005')
    // Exponent partials stage silently; completion requests exactly.
    await input.fill('1.2E')
    await expect(input).toHaveValue('1.2E')
    await expect(log).toHaveText('log: 12005')
    await input.fill('1.2E4')
    await expect(log).toHaveText('log: 12005,12000')
    // Validate mode retains the off-step value and reports managed
    // invalidity without native range/step validity.
    await input.fill('12001')
    await expect(log).toHaveText('log: 12005,12000,12001')
    await expect(display).toHaveText('Value: 12001')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    // Same-root reset reverts staged invalid text with no request. (Runs
    // before the composition cycle: programmatic staging after a shadow
    // composition invalidation is swallowed on React 17 only — see the
    // wave log anomaly note. ENV-06 proves the same reset shape.)
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      setter.call(target, 'abc')
      target.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await expect(input).toHaveValue('abc')
    await page.getByTestId('sci-reset').click()
    await expect(input).toHaveValue(await fmt('en-US', 12001))
    await expect(log).toHaveText('log: 12005,12000,12001')
    // Locale replacement during composition: coherent new text, editing
    // cleared, stale fallout ignored, zero callback.
    await input.click()
    await page.keyboard.press('ControlOrMeta+a')
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      target.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, cancelable: true }))
      setter.call(target, 'ni3hao')
      target.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await expect(input).toHaveValue('ni3hao')
    await page.getByTestId('sci-de').click()
    await expect(input).toHaveValue(await fmt('de-DE', 12001))
    await expect(input).not.toHaveAttribute('data-editing', '')
    await expect(log).toHaveText('log: 12005,12000,12001')
    await input.evaluate(el => {
      const target = el as HTMLInputElement
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
      target.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, cancelable: true }))
      setter.call(target, 'ni3hao!')
      target.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await expect(input).toHaveValue(await fmt('de-DE', 12001))
    await expect(log).toHaveText('log: 12005,12000,12001')
    // Value replacement mid-session + canonical submit, all inside the
    // shadow form.
    await page.getByTestId('sci-set-5005').click()
    await expect(display).toHaveText('Value: 5005')
    await expect(input).toHaveValue(await fmt('de-DE', 5005))
    await expect(input).not.toHaveAttribute('aria-invalid', 'true')
    await page.getByTestId('sci-submit').click()
    await expect(page.getByTestId('sci-payload')).toHaveText('payload: sci=5005')
    // Local relationships: the labelledby stepper resolved in shadow,
    // and shadow IDs stay invisible to the document.
    await expect(page.getByTestId('sci-inc')).toHaveCount(1)
    const docLookup = await page.evaluate(
      () => document.getElementById('sci-name') !== null
    )
    expect(docLookup).toBe(false)
  })

  test('NF-A11Y-01 scan: axe reports zero violations on the named stepper field', async ({
    mount,
    page,
  }) => {
    // Scanner half of NF-A11Y-01 (assertion half is the NF-A11Y-01..06 unit
    // convergence suite): the labeled StepperFixture exercises input +
    // steppers in one mount; #root scoping covers the whole story (no
    // portals in NumberField).
    await mount('components/NumberField/NumberField/StepperFixture')
    const input = page.getByTestId('number-field-input')
    await expect(input).toBeVisible()
    await expect(input).toHaveAccessibleName('Quantity')
    await expectNoAxeViolations(page, { include: '#root' })
  })
})
