/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-CB-01: Listbox should switch to Combobox virtual focus without changing option selection semantics', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/ComboBasic')
    await expect(page.getByTestId('cb-root')).toBeVisible()

    const input = page.getByTestId('cb-input')
    const alpha = page.getByTestId('cb-alpha')
    const bravo = page.getByTestId('cb-bravo')

    await input.click()
    await expect(page.getByTestId('cb-popover')).toBeVisible()

    // No DOM tab stop or DOM focus on any option; focus stays in the input
    await expect(alpha).toHaveAttribute('tabindex', '-1')
    await expect(bravo).toHaveAttribute('tabindex', '-1')
    await expect(input).toBeFocused()

    // Virtual focus moves alpha -> bravo; activedescendant tracks the real ID
    await page.keyboard.press('ArrowDown')
    await expect(alpha).toHaveAttribute('data-active', '')
    const alphaId = await alpha.getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', alphaId ?? '')
    await page.keyboard.press('ArrowDown')
    await expect(bravo).toHaveAttribute('data-active', '')
    const bravoId = await bravo.getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', bravoId ?? '')
    await expect(input).toBeFocused()

    // Commit produces the same scalar value once
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('cb-log')).toHaveText('["change:bravo"]')
    await expect(page.getByTestId('cb-value')).toHaveText('Selected: bravo')
  })
});
