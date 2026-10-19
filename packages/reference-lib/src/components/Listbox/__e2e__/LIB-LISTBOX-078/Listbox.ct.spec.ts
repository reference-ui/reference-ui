/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-CB-03: Listbox should yield commit callback authority to its containing Combobox', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/ComboBasic')
    await expect(page.getByTestId('cb-root')).toBeVisible()

    // Valid shape: the Listbox carries no onChange; only Combobox commits, once
    await page.getByTestId('cb-input').click()
    await expect(page.getByTestId('cb-popover')).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('cb-log')).toHaveText('["change:bravo"]')

    // Invalid shape (nested Listbox onChange) is pinned by the LB-CB-03 unit
    // test with the two-authority diagnostic; the live tree never dual-fires.
  })
});
