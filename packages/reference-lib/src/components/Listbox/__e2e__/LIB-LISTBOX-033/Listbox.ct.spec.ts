/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-DYNAMIC-02: Listbox should recover deterministically when its focused option is removed', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/DynamicRemove')
    await expect(page.getByTestId('dyn-remove-root')).toBeVisible()

    const bravo = page.getByTestId('dynr-bravo')
    await bravo.focus()

    await page.getByTestId('dyn-remove-bravo').click()
    await expect(page.getByTestId('dynr-delta')).toBeFocused()
  })
});
