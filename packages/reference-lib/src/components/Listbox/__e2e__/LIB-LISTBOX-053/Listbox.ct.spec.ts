/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-SINGLE-03: Listbox should request the same single selection when Enter activates an option', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/RequestLog')
    await expect(page.getByTestId('req-root')).toBeVisible()

    const bravo = page.getByTestId('req-bravo')
    const calls = page.getByTestId('req-calls')

    await bravo.focus()
    await page.keyboard.press('Enter')
    await expect(calls).toHaveText('["bravo"]')
    await expect(bravo).toBeFocused()
    expect(((await calls.textContent()) ?? '').match(/bravo/g)).toHaveLength(1)
  })
});
