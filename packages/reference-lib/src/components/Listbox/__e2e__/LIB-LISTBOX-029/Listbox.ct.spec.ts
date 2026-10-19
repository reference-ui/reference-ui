/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-KEY-04: Listbox typeahead should wrap to the next enabled matching option without selecting it', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Typeahead')
    await expect(page.getByTestId('type-root')).toBeVisible()

    const apple = page.getByTestId('type-apple')
    const avocado = page.getByTestId('type-avocado')
    const calls = page.getByTestId('type-calls')

    await apple.focus()
    await page.keyboard.type('a')
    await expect(avocado).toBeFocused()

    await page.keyboard.type('a')
    await expect(apple).toBeFocused()
    await expect(calls).toHaveText('[]')
  })
});
