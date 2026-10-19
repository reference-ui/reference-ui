/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-DYNAMIC-01: Listbox should follow option identity through insertion and reorder while navigating current order', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/DynamicOrder')
    await expect(page.getByTestId('dyn-order-root')).toBeVisible()

    const bravo = page.getByTestId('dyn-bravo')
    await bravo.focus()

    await page.getByTestId('dyn-insert-delta').click()
    await expect(bravo).toBeFocused()

    await page.getByTestId('dyn-reorder-charlie').click()
    await expect(bravo).toBeFocused()

    await page.keyboard.press('ArrowUp')
    await expect(page.getByTestId('dyn-charlie')).toBeFocused()
  })
});
