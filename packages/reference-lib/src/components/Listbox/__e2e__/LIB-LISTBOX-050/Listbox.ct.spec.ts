/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-GROUP-05: Listbox should ignore group markup when deriving option state', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/NativeGroups')
    await expect(page.getByTestId('ng-root')).toBeVisible()

    const kiwi = page.getByTestId('ng-kiwi')

    // Group attributes preserved but not inherited
    await expect(page.getByTestId('ng-group-nested')).toHaveAttribute('aria-disabled', 'true')
    await expect(kiwi).not.toHaveAttribute('aria-disabled')
    await expect(kiwi).not.toHaveAttribute('data-disabled')
    await expect(page.getByTestId('ng-group-zulu').getByRole('option')).toHaveCount(0)

    // The deeply nested option navigates and typeaheads normally
    await page.getByTestId('ng-apple').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('ng-zulu')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(kiwi).toBeFocused()

    await page.getByTestId('ng-apple').focus()
    await page.keyboard.type('k')
    await expect(kiwi).toBeFocused()
  })
});
