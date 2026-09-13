import { test, expect, snap } from '../../../../playwright/ct'

test.describe('NumberField CT', () => {
  test('renders spinbutton, steppers, and increments/decrements via keyboard and buttons', async ({
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

    await expect(input).toHaveAttribute('role', 'spinbutton')
    await expect(input).toHaveAttribute('aria-valuenow', '42')
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
})
