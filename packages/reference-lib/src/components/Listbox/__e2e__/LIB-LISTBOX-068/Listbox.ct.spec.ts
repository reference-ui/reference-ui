/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-DYNAMIC-04: Listbox should remove a newly disabled option from navigation without clearing controlled selection', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/DynamicDisable')
    await expect(page.getByTestId('dd-root')).toBeVisible()

    const bravo = page.getByTestId('dd-bravo')
    const charlie = page.getByTestId('dd-charlie')
    const calls = page.getByTestId('dd-calls')

    await bravo.focus()
    await page.getByTestId('dd-disable-bravo').click()
    await expect(bravo).toHaveAttribute('aria-disabled', 'true')
    await expect(bravo).toHaveAttribute('data-disabled', '')
    await expect(bravo).toHaveAttribute('tabindex', '-1')
    await expect(charlie).toBeFocused()
    await expect(bravo).toHaveAttribute('aria-selected', 'true')
    await expect(calls).toHaveText('[]')

    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('dd-alpha')).toBeFocused()

    await bravo.click({ force: true })
    await expect(page.getByTestId('dd-alpha')).toBeFocused()
    await expect(calls).toHaveText('[]')
  })
});
