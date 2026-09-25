import { test, expect, snap } from '../../../../playwright/ct'

test.describe('Field CT', () => {
  test('FI-DOM-01: Field should render a wrapping div with no role and data-reference-field', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/StatusAndFocusFixture')

    const field = page.getByTestId('test-field')
    const input = page.getByTestId('field-input')

    await expect(field).toBeVisible()
    await expect(field).toHaveAttribute('data-reference-field', '')
    await expect(field).not.toHaveAttribute('role')
    await expect(input).toBeVisible()

    // Authored children stay in order: input is a descendant of field
    const parent = await input.evaluate(el => el.parentElement?.getAttribute('data-testid'))
    expect(parent).toBe('test-field')

    await page.waitForTimeout(300)
    await snap(page, 'field-resting')
    const root = page.getByTestId('field-fixture-root')
    await snap(root, 'field-root-resting', { maxDiffPixelRatio: 0.001 })
    await snap(field, 'field-control-resting', { maxDiffPixelRatio: 0.001 })
  })

  test('FI-DOM-02: Field should not receive ARIA validity when the enclosed input is invalid', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/StatusAndFocusFixture')

    const field = page.getByTestId('test-field')
    const input = page.getByTestId('field-input')

    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(field).not.toHaveAttribute('aria-invalid')
    await expect(field).not.toHaveAttribute('aria-errormessage')
    await expect(field).not.toHaveAttribute('data-invalid')
  })

  test('FI-DOM-02 (runtime): Field strips prohibited role and ARIA props from JS callers', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/ProhibitedPropsFixture')

    const field = page.getByTestId('prohibited-props-field')
    await expect(field).toBeVisible()

    // Prohibited surface never reaches the host, even when spread by JS
    await expect(field).not.toHaveAttribute('role')
    await expect(field).not.toHaveAttribute('aria-invalid')
    await expect(field).not.toHaveAttribute('aria-disabled')
    await expect(field).not.toHaveAttribute('aria-readonly')
    await expect(field).not.toHaveAttribute('aria-required')
    await expect(field).not.toHaveAttribute('aria-errormessage')

    // Host pins cannot be spoofed through the spread
    await expect(field).toHaveAttribute('data-reference-field', '')
    await expect(field).not.toHaveAttribute('data-status')

    await page.waitForTimeout(300)
    await snap(page, 'field-prohibited-props')
  })

  test('FI-DOM-03: Field should set data-status="warning" only when status is warning', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/StatusAndFocusFixture')

    const field = page.getByTestId('test-field')

    // Initial omitted status
    await expect(field).not.toHaveAttribute('data-status')
    await expect(field).not.toHaveAttribute('aria-invalid')

    // Toggle warning on
    await page.getByTestId('btn-toggle-warning').click()
    await expect(field).toHaveAttribute('data-status', 'warning')
    await expect(field).not.toHaveAttribute('aria-invalid')
    await page.waitForTimeout(300)
    await snap(page, 'field-status-warning')
    await snap(field, 'field-control-warning', { maxDiffPixelRatio: 0.001 })

    // Toggle warning off
    await page.getByTestId('btn-toggle-warning').click()
    await expect(field).not.toHaveAttribute('data-status')
  })

  test('FI-CSS-01: Field should put a descendant Input into embedded mode', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/EmbeddedChromeFixture')

    const standaloneInput = page.getByTestId('standalone-input')
    const embeddedInput = page.getByTestId('embedded-input')
    const field = page.getByTestId('field-with-embedded-input')

    // Settle: computed chrome reads need the theme CSS applied
    await expect(field).toBeVisible()
    await page.waitForTimeout(300)

    const standaloneStyles = await standaloneInput.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        borderWidth: s.borderWidth,
        borderStyle: s.borderStyle,
      }
    })

    const embeddedStyles = await embeddedInput.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        borderWidth: s.borderWidth,
        borderStyle: s.borderStyle,
        backgroundColor: s.backgroundColor,
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
      }
    })

    const fieldStyles = await field.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        borderWidth: s.borderWidth,
        borderStyle: s.borderStyle,
      }
    })

    // Standalone has border
    expect(standaloneStyles.borderWidth).toBe('1px')
    expect(standaloneStyles.borderStyle).toBe('solid')

    // Embedded loses border, background, and outline
    expect(embeddedStyles.borderWidth).toBe('0px')
    expect(embeddedStyles.borderStyle).toBe('none')
    expect(
      embeddedStyles.backgroundColor === 'rgba(0, 0, 0, 0)' ||
      embeddedStyles.backgroundColor === 'transparent'
    ).toBe(true)
    expect(
      embeddedStyles.outlineWidth === '0px' ||
      embeddedStyles.outlineStyle === 'none' ||
      embeddedStyles.outlineColor === 'rgba(0, 0, 0, 0)' ||
      embeddedStyles.outlineColor === 'transparent' ||
      embeddedStyles.outlineColor.includes('/ 0)')
    ).toBe(true)

    // Field host carries the bezel border
    expect(fieldStyles.borderWidth).toBe('1px')
    expect(fieldStyles.borderStyle).toBe('solid')

    await page.waitForTimeout(300)
    await snap(page, 'field-embedded-chrome')
  })

  test('FI-CSS-02: Field should leave a sibling Input outside Field fully chromed', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/EmbeddedChromeFixture')

    const embeddedInput = page.getByTestId('embedded-input')
    const siblingInput = page.getByTestId('sibling-input')

    await expect(siblingInput).toBeVisible()
    await page.waitForTimeout(300)

    const embeddedStyles = await embeddedInput.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { borderWidth: s.borderWidth, borderStyle: s.borderStyle }
    })

    const siblingStyles = await siblingInput.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { borderWidth: s.borderWidth, borderStyle: s.borderStyle }
    })

    // Embedded inside Field loses border
    expect(embeddedStyles.borderWidth).toBe('0px')
    expect(embeddedStyles.borderStyle).toBe('none')

    // Sibling outside Field retains standalone border
    expect(siblingStyles.borderWidth).toBe('1px')
    expect(siblingStyles.borderStyle).toBe('solid')
  })

  test('FI-CSS-03: Field should embed Textarea and Select with the same descendant selector', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/EmbeddedChromeFixture')

    const embeddedTextarea = page.getByTestId('embedded-textarea')
    const standaloneTextarea = page.getByTestId('standalone-textarea')

    await expect(standaloneTextarea).toBeVisible()
    await page.waitForTimeout(300)

    const standaloneTa = await standaloneTextarea.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { borderWidth: s.borderWidth, borderStyle: s.borderStyle }
    })
    const embeddedTa = await embeddedTextarea.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { borderWidth: s.borderWidth, borderStyle: s.borderStyle }
    })

    expect(standaloneTa.borderWidth).toBe('1px')
    expect(embeddedTa.borderWidth).toBe('0px')
    expect(embeddedTa.borderStyle).toBe('none')

    const embeddedSelect = page.getByTestId('embedded-select')
    const standaloneSelect = page.getByTestId('standalone-select')

    const standaloneSel = await standaloneSelect.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { borderWidth: s.borderWidth, borderStyle: s.borderStyle }
    })
    const embeddedSel = await embeddedSelect.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { borderWidth: s.borderWidth, borderStyle: s.borderStyle }
    })

    expect(standaloneSel.borderWidth).toBe('1px')
    expect(embeddedSel.borderWidth).toBe('0px')
    expect(embeddedSel.borderStyle).toBe('none')
  })

  test('FI-CSS-04: Field-surface hosts should embed DateField, Combobox.Input, and NumberField.Input', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/CompoundEmbedFixture')

    const dateInput = page.getByTestId('compound-datefield')
    const comboInput = page.getByTestId('compound-combobox-input')
    const numberInput = page.getByTestId('compound-number-input')

    await expect(numberInput).toBeVisible()
    await page.waitForTimeout(300)

    const dateStyles = await dateInput.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { borderWidth: s.borderWidth, borderStyle: s.borderStyle }
    })
    const comboStyles = await comboInput.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { borderWidth: s.borderWidth, borderStyle: s.borderStyle }
    })
    const numberStyles = await numberInput.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { borderWidth: s.borderWidth, borderStyle: s.borderStyle }
    })

    expect(dateStyles.borderWidth).toBe('0px')
    expect(comboStyles.borderWidth).toBe('0px')
    expect(numberStyles.borderWidth).toBe('0px')

    await page.waitForTimeout(300)
    await snap(page, 'field-compound')
  })

  test('FI-CSS-05: mouse click changes border color without outline ring; keyboard tab applies focus ring', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/StatusAndFocusFixture')

    const standardField = page.getByTestId('standard-field')
    const standardInput = page.getByTestId('standard-field-input')

    // Initial state: outline is transparent/none
    const initialOutline = await standardField.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth }
    })
    expect(
      initialOutline.outlineStyle === 'none' ||
      initialOutline.outlineWidth === '0px' ||
      initialOutline.outlineStyle === 'solid',
    ).toBe(true)

    // Mouse click into input: focus triggered, but NOT :focus-visible
    await standardInput.click()
    await expect(standardInput).toBeFocused()
    await page.waitForTimeout(200)
    await snap(page, 'field-mouse-focused')

    const mouseClickStyles = await standardField.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
        borderColor: s.borderColor,
      }
    })

    // On mouse click: outline color is transparent (no visible focus ring)
    const isOutlineTransparent =
      mouseClickStyles.outlineStyle === 'none' ||
      mouseClickStyles.outlineWidth === '0px' ||
      mouseClickStyles.outlineColor === 'rgba(0, 0, 0, 0)' ||
      mouseClickStyles.outlineColor === 'transparent' ||
      mouseClickStyles.outlineColor.includes('/ 0)')

    expect(isOutlineTransparent).toBe(true)

    // Press Tab from toggle button to keyboard-focus into the input -> :focus-visible
    await page.getByTestId('btn-toggle-warning').focus()
    // Tab twice: once to test-field input, second to standard-field input
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await expect(standardInput).toBeFocused()

    // Wait for the focus transition to finish
    await page.waitForTimeout(200)
    await snap(page, 'field-keyboard-focused')

    const keyboardTabStyles = await standardField.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
        borderColor: s.borderColor,
      }
    })
    const tabInputStyles = await standardInput.evaluate(el => {
      const s = window.getComputedStyle(el)
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
      }
    })

    // On keyboard tab: focus ring outline is 2px solid and non-transparent
    expect(keyboardTabStyles.outlineStyle).toBe('solid')
    expect(keyboardTabStyles.outlineWidth).toBe('2px')
    expect(keyboardTabStyles.outlineColor.includes('/ 0)')).toBe(false)
    // Border color on keyboard tab stays subtle and does not duplicate the white outline ring
    expect(keyboardTabStyles.borderColor).not.toBe(mouseClickStyles.borderColor)

    // The visible ring is on Field, not on the enclosed Input
    expect(
      tabInputStyles.outlineWidth === '0px' ||
      tabInputStyles.outlineStyle === 'none' ||
      tabInputStyles.outlineColor === 'rgba(0, 0, 0, 0)' ||
      tabInputStyles.outlineColor === 'transparent' ||
      tabInputStyles.outlineColor.includes('/ 0)')
    ).toBe(true)
  })

  test('FI-CSS-07: Field should match invalid chrome through :has([aria-invalid="true"])', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/StateChromeFixture')

    const field = page.getByTestId('field-css7')
    const input = page.getByTestId('input-css7')
    const toggleBtn = page.getByTestId('btn-toggle-css7-invalid')

    await expect(field).toBeVisible()
    await page.waitForTimeout(300)
    await snap(page, 'field-state-chrome')

    const defaultBorder = await field.evaluate(el => window.getComputedStyle(el).borderColor)

    // Toggle invalid on (bezel border-color transitions over 150ms)
    await toggleBtn.click()
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await page.waitForTimeout(300)

    const invalidBorder = await field.evaluate(el => window.getComputedStyle(el).borderColor)
    expect(invalidBorder).not.toBe(defaultBorder)

    // Field itself never receives aria-invalid
    await expect(field).not.toHaveAttribute('aria-invalid')

    // Toggle invalid off
    await toggleBtn.click()
    await expect(input).not.toHaveAttribute('aria-invalid')
    await page.waitForTimeout(300)

    const resetBorder = await field.evaluate(el => window.getComputedStyle(el).borderColor)
    expect(resetBorder).not.toBe(invalidBorder)
  })

  test('FI-CSS-08: Field should match disabled chrome from the enclosed control, not a nested Button', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/StateChromeFixture')

    const disabledField = page.getByTestId('field-disabled-control')
    const activeFieldWithDisabledBtn = page.getByTestId('field-disabled-button')

    await expect(disabledField).toBeVisible()
    await page.waitForTimeout(300)

    const disabledControlStyles = await disabledField.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { opacity: s.opacity, cursor: s.cursor }
    })

    const activeControlStyles = await activeFieldWithDisabledBtn.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { opacity: s.opacity, cursor: s.cursor }
    })

    // Bezel with disabled input has disabled opacity and cursor
    expect(Number(disabledControlStyles.opacity)).toBeCloseTo(0.5, 1)
    expect(disabledControlStyles.cursor).toBe('not-allowed')

    // Bezel with only disabled button retains normal opacity
    expect(Number(activeControlStyles.opacity)).toBeCloseTo(1, 1)
    expect(activeControlStyles.cursor).not.toBe('not-allowed')
  })

  test('FI-CSS-09: Field should match read-only chrome from [readonly] on the enclosed input', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/StateChromeFixture')

    const readonlyField = page.getByTestId('field-readonly-control')
    const normalFieldWithReadonlyBtn = page.getByTestId('field-readonly-button')

    await expect(readonlyField).toBeVisible()
    await page.waitForTimeout(300)

    const roBg = await readonlyField.evaluate(el => window.getComputedStyle(el).backgroundColor)
    const normalBg = await normalFieldWithReadonlyBtn.evaluate(el => window.getComputedStyle(el).backgroundColor)

    // Readonly input triggers read-only background surface
    expect(roBg).not.toBe(normalBg)
  })

  test('FI-CSS-10: Field should show warning chrome from data-status without implying invalid', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/StateChromeFixture')

    const field = page.getByTestId('field-warning-stack')
    const input = page.getByTestId('input-warning-stack')
    const toggleBtn = page.getByTestId('btn-toggle-css10-invalid')

    await expect(field).toBeVisible()
    await page.waitForTimeout(300)

    await expect(field).toHaveAttribute('data-status', 'warning')
    await expect(field).not.toHaveAttribute('aria-invalid')
    await expect(input).not.toHaveAttribute('aria-invalid')

    const defaultBorder = await page.getByTestId('field-css7').evaluate(el => window.getComputedStyle(el).borderColor)
    const warningBorder = await field.evaluate(el => window.getComputedStyle(el).borderColor)
    expect(warningBorder).not.toBe(defaultBorder)

    // Add aria-invalid="true" to Input: invalid stacks on warning
    await toggleBtn.click()
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await page.waitForTimeout(300)

    const stackedBorder = await field.evaluate(el => window.getComputedStyle(el).borderColor)
    expect(stackedBorder).not.toBe(warningBorder)
    expect(stackedBorder).not.toBe(defaultBorder)
    // But data-status="warning" is NOT cleared
    await expect(field).toHaveAttribute('data-status', 'warning')
    // Field itself still has NO aria-invalid
    await expect(field).not.toHaveAttribute('aria-invalid')
  })

  test('FI-SURF-01: Field-surface hosts should share one bezel recipe across the documented compositions', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/SurfaceRecipeFixture')

    const f1 = page.getByTestId('surf-fixture-1')
    const f2 = page.getByTestId('surf-fixture-2')
    const f3 = page.getByTestId('surf-fixture-3')
    const f4 = page.getByTestId('surf-fixture-4')

    // All 4 have data-reference-field
    await expect(f1).toHaveAttribute('data-reference-field', '')
    await expect(f2).toHaveAttribute('data-reference-field', '')
    await expect(f3).toHaveAttribute('data-reference-field', '')
    await expect(f4).toHaveAttribute('data-reference-field', '')

    // Fixture 4 (NumberField) has role="group", 1-3 have no role
    await expect(f4).toHaveAttribute('role', 'group')
    await expect(f1).not.toHaveAttribute('role')
    await expect(f2).not.toHaveAttribute('role')
    await expect(f3).not.toHaveAttribute('role')

    await expect(f4).toBeVisible()
    await page.waitForTimeout(300)

    // Compare baseline chrome (borderWidth, borderStyle, borderRadius) across all 4 hosts
    const getChrome = async (locator: typeof f1) =>
      locator.evaluate(el => {
        const s = window.getComputedStyle(el)
        return {
          borderWidth: s.borderWidth,
          borderStyle: s.borderStyle,
          borderRadius: s.borderRadius,
        }
      })

    const c1 = await getChrome(f1)
    const c2 = await getChrome(f2)
    const c3 = await getChrome(f3)
    const c4 = await getChrome(f4)

    expect(c1.borderWidth).toBe('1px')
    expect(c1.borderStyle).toBe('solid')
    expect(c2.borderWidth).toBe(c1.borderWidth)
    expect(c3.borderWidth).toBe(c1.borderWidth)
    expect(c4.borderWidth).toBe(c1.borderWidth)
    expect(c2.borderRadius).toBe(c1.borderRadius)
    expect(c3.borderRadius).toBe(c1.borderRadius)
    expect(c4.borderRadius).toBe(c1.borderRadius)

    await page.waitForTimeout(300)
    await snap(page, 'field-surface')

    // Switch to warning state and assert identical warning border across 1 and 4
    await page.getByTestId('btn-surf-warning').click()
    await page.waitForTimeout(300)
    const w1Border = await f1.evaluate(el => window.getComputedStyle(el).borderColor)
    const w4Border = await f4.evaluate(el => window.getComputedStyle(el).borderColor)
    // Both produce amber warning border hues
    expect(w1Border.startsWith('oklab(0.7') || w1Border.startsWith('oklch(0.7')).toBe(true)
    expect(w4Border.startsWith('oklab(0.7') || w4Border.startsWith('oklch(0.7')).toBe(true)

    // Switch to invalid state and assert identical invalid border
    await page.getByTestId('btn-surf-invalid').click()
    await page.waitForTimeout(300)
    const inv1Border = await f1.evaluate(el => window.getComputedStyle(el).borderColor)
    const inv4Border = await f4.evaluate(el => window.getComputedStyle(el).borderColor)
    expect(inv1Border).toBe(inv4Border)
    expect(inv1Border).not.toBe(w1Border)

    // Switch to disabled state and assert identical opacity
    await page.getByTestId('btn-surf-disabled').click()
    await page.waitForTimeout(250)
    const d1Op = await f1.evaluate(el => window.getComputedStyle(el).opacity)
    const d4Op = await f4.evaluate(el => window.getComputedStyle(el).opacity)
    expect(Number(d1Op)).toBeCloseTo(0.5, 1)
    expect(Number(d4Op)).toBeCloseTo(0.5, 1)
  })

  test('FI-LAY-01: Field should arrange prefix, control, and action in authored order', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/AmountFixture')

    const field = page.getByTestId('amount-field')
    const prefix = page.getByTestId('amount-prefix')
    const input = page.getByTestId('amount-input')
    const clearBtn = page.getByTestId('amount-clear-btn')

    await expect(prefix).toBeVisible()
    await expect(input).toBeVisible()
    await expect(clearBtn).toBeVisible()

    // Source order in DOM
    const childrenOrder = await field.evaluate(el =>
      Array.from(el.children).map(c => c.getAttribute('data-testid'))
    )
    expect(childrenOrder).toEqual(['amount-prefix', 'amount-input', 'amount-clear-btn'])

    // Native button with accessible name
    const buttonRole = page.getByRole('button', { name: 'Clear amount' })
    await expect(buttonRole).toBeVisible()

    // Horizontal row layout: prefix.x < input.x < button.x
    const prefixBox = await prefix.boundingBox()
    const inputBox = await input.boundingBox()
    const btnBox = await clearBtn.boundingBox()

    expect(prefixBox).not.toBeNull()
    expect(inputBox).not.toBeNull()
    expect(btnBox).not.toBeNull()

    if (prefixBox && inputBox && btnBox) {
      expect(prefixBox.x).toBeLessThan(inputBox.x)
      expect(inputBox.x).toBeLessThan(btnBox.x)
    }

    await page.waitForTimeout(300)
    await snap(page, 'field-amount')
  })

  test('FI-COMP-01: Field should keep Label htmlFor on the input in the amount composition', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/AmountFixture')

    const label = page.getByTestId('amount-label')
    const field = page.getByTestId('amount-field')
    const input = page.getByTestId('amount-input')
    const errorMsg = page.getByTestId('amount-error-msg')

    // Label htmlFor matches input id
    await expect(label).toHaveAttribute('for', 'amount-input')
    await expect(input).toHaveAttribute('id', 'amount-input')

    // Clicking label focuses input
    await label.click()
    await expect(input).toBeFocused()

    // Field has no role and no AT attributes
    await expect(field).not.toHaveAttribute('role')
    await expect(field).not.toHaveAttribute('aria-invalid')
    await expect(field).not.toHaveAttribute('aria-describedby')

    // AT attributes live on Input
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveAttribute('aria-describedby', 'amount-error')
    await expect(errorMsg).toHaveAttribute('id', 'amount-error')
  })

  test('FI-COMP-02 (bezel): Field hosts the DateField compound bezel without owning its state', async ({
    mount,
    page,
  }) => {
    // Reduced to the Field-owned bezel share (TESTS.md "Owned elsewhere":
    // typing sessions and ISO publishing belong to DateField).
    await mount('components/Field/Field/DateCompoundFixture')

    const root = page.getByTestId('comp-datefield-wrapper')
    const input = page.getByTestId('comp-datefield-input')
    const trigger = page.getByTestId('comp-datefield-trigger')

    await expect(input).toBeVisible()
    await page.waitForTimeout(300)

    // Bezel wraps input and trigger
    const bezel = root.locator('[data-reference-field]')
    await expect(bezel).toBeVisible()
    await expect(bezel.locator(input)).toBeVisible()
    await expect(bezel.locator(trigger)).toBeVisible()

    // Trigger button carries its accessible name
    await expect(trigger).toHaveAttribute('aria-label', 'Open calendar')

    // The compound input is embedded in the shared bezel
    const inputBorder = await input.evaluate(el => window.getComputedStyle(el).borderWidth)
    expect(inputBorder).toBe('0px')

    // Value publishing surfaces without Field state
    await expect(page.getByTestId('comp-datefield-val')).toHaveText('Value: 2026-09-10')

    await page.waitForTimeout(300)
    await snap(page, 'field-date-compound')
  })

  test('FI-COMP-03: NumberField.Group should consume the Field recipe without a nested Field', async ({
    mount,
    page,
  }) => {
    await mount('components/Field/Field/CompoundEmbedFixture')

    const group = page.getByTestId('comp-numberfield-group')
    const input = page.getByTestId('comp-number-input')

    await expect(input).toBeVisible()
    await page.waitForTimeout(300)

    // Group is div[role="group"][data-reference-field]
    await expect(group).toHaveAttribute('role', 'group')
    await expect(group).toHaveAttribute('data-reference-field', '')

    // Input is embedded
    const inputStyles = await input.evaluate(el => {
      const s = window.getComputedStyle(el)
      return { borderWidth: s.borderWidth, borderStyle: s.borderStyle }
    })
    expect(inputStyles.borderWidth).toBe('0px')

    // No separate nested Field node inside group
    const nestedFieldCount = await group.locator('> [data-reference-field]').count()
    expect(nestedFieldCount).toBe(0)

    // Application error fixture: wrapping Group in Field produces two distinct bezels
    const doubleWrapper = page.getByTestId('comp-double-bezel-wrapper')
    const doubleInner = page.getByTestId('comp-double-bezel-inner')
    await expect(doubleWrapper).toHaveAttribute('data-reference-field', '')
    await expect(doubleInner).toHaveAttribute('data-reference-field', '')
  })

  test('FI-COMP-04 (bezel): Field hosts a Combobox token picker without owning Combobox or chips', async ({
    mount,
    page,
  }) => {
    // Field-owned subset: label/input-embed/opener/chips/portal/invalid-bezel.
    // Focus-ring-on-opener assertions are omitted: they need the shared-theme
    // focus propagation change, which is SUSPECT quarantine material outside
    // Field scope (flagged in the mission log). Commit/remove flows belong to
    // Combobox (TESTS.md "Owned elsewhere").
    await mount('components/Field/Field/TokenPickerFixture')

    const label = page.getByTestId('comp-people-label')
    const field = page.getByTestId('comp-people-field')
    const input = page.getByTestId('comp-people-input')
    const opener = page.getByTestId('comp-people-opener')
    const chipAlice = page.getByTestId('chip-Alice')
    const toggleInvBtn = page.getByTestId('btn-toggle-cb-invalid')

    await expect(input).toBeVisible()
    await page.waitForTimeout(300)

    // 1. Label htmlFor targets input id
    await expect(label).toHaveAttribute('for', 'people')
    await expect(input).toHaveAttribute('id', 'people')

    // 2. Field has no role
    await expect(field).not.toHaveAttribute('role')

    // 3. Input is embedded
    const inputBorder = await input.evaluate(el => window.getComputedStyle(el).borderWidth)
    expect(inputBorder).toBe('0px')

    // 4. Opener is button[type=button], not Combobox.Trigger
    await expect(opener).toHaveAttribute('type', 'button')
    await expect(opener).not.toHaveAttribute('data-reference-combobox-trigger')

    // 5. Chips are named native buttons
    await expect(chipAlice).toHaveAttribute('type', 'button')
    await expect(chipAlice).toHaveAttribute('aria-label', 'Remove Alice')

    await page.waitForTimeout(300)
    await snap(page, 'field-token-picker')

    // 6. Click opener: Input is focused, popover opens
    await opener.scrollIntoViewIfNeeded()
    await page.waitForTimeout(100)
    await opener.click()
    await expect(page.locator('#people')).toBeFocused()
    const popover = page.getByTestId('comp-people-popover')
    await expect(popover).toBeVisible()

    // Popover is portalled, not a child of Field
    const isChildOfField = await field.evaluate(
      (f, p) => f.contains(p),
      await popover.elementHandle()
    )
    expect(isChildOfField).toBe(false)

    // 10. aria-invalid on Input drives bezel; chip button does not
    const defaultBorder = await field.evaluate(el => window.getComputedStyle(el).borderColor)
    await toggleInvBtn.click()
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await page.waitForTimeout(300)
    const invBorder = await field.evaluate(el => window.getComputedStyle(el).borderColor)
    expect(invBorder).not.toBe(defaultBorder)
  })

  test('renders field with prefix and suffix', async ({ mount, page }) => {
    await mount('components/Field/Field/PrefixAndSuffix')

    const field = page.getByTestId('prefix-suffix-field')
    await expect(field).toBeVisible()
    await page.waitForTimeout(300)
    await snap(page, 'field-prefix-suffix')

    const input = field.locator('input')
    await input.focus()
    await page.waitForTimeout(200)
    await snap(page, 'field-prefix-suffix-focused')
  })
})
