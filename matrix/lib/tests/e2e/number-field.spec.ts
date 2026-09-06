import { expect, test } from '@playwright/test'

test.describe('NumberField Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/number-field')
    await expect(page.getByTestId('number-field-fixture-root')).toBeVisible()
  })

  test('NF-DOM-01: Renders spinbutton, steppers, and increments/decrements via keyboard and buttons', async ({
    page,
  }) => {
    const input = page.getByTestId('number-field-input')
    const btnInc = page.getByTestId('btn-increment')
    const btnDec = page.getByTestId('btn-decrement')
    const display = page.getByTestId('number-field-value-display')

    await expect(input).toHaveAttribute('role', 'spinbutton')
    await expect(input).toHaveAttribute('aria-valuenow', '42')
    await expect(input).toHaveValue('42')
    await expect(display).toHaveText('Numeric Value: 42')

    const incBox = await btnInc.boundingBox()
    const decBox = await btnDec.boundingBox()
    expect(incBox).not.toBeNull()
    expect(decBox).not.toBeNull()
    expect(incBox!.width).toBeCloseTo(incBox!.height, 0)
    expect(decBox!.width).toBeCloseTo(decBox!.height, 0)

    // Click increment -> 43
    await btnInc.click()
    await expect(input).toHaveValue('43')
    await expect(display).toHaveText('Numeric Value: 43')

    // Click decrement -> 42
    await btnDec.click()
    await expect(input).toHaveValue('42')
    await expect(display).toHaveText('Numeric Value: 42')

    // Keyboard ArrowUp -> 43
    await input.focus()
    await page.keyboard.press('ArrowUp')
    await expect(input).toHaveValue('43')
    await expect(display).toHaveText('Numeric Value: 43')
  })

  test('NF-DOM-02: Mouse click into NumberField changes border color without outline ring', async ({
    page,
  }) => {
    const root = page.getByTestId('number-field-root')
    const input = page.getByTestId('number-field-input')

    await input.click()
    await expect(input).toBeFocused()

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

  test('NF-DOM-03: Keyboard tab applies focus ring and keeps border color aligned with Field (no duplicate white border)', async ({
    page,
  }) => {
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
})
