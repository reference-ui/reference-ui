/**
 * Field browser proofs: DOM and ARIA surface plus embedded-chrome,
 * state-chrome, surface, layout, and composition rows. Mounts the story
 * fixtures and asserts the host stays roleless with status-only data
 * attributes in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Field CT', () => {
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
});
