/**
 * Field browser proofs: DOM and ARIA surface plus embedded-chrome,
 * state-chrome, surface, layout, and composition rows. Mounts the story
 * fixtures and asserts the host stays roleless with status-only data
 * attributes in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Field CT', () => {
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
});
