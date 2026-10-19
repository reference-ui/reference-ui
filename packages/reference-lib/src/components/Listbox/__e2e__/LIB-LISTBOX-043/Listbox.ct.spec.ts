/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-DOM-09: Listbox typeahead should use explicit text before current meaningful rendered text', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/TextNames')
    await expect(page.getByTestId('text-root')).toBeVisible()

    const zulu = page.getByTestId('text-zulu')
    const bravo = page.getByTestId('text-bravo')
    const calls = page.getByTestId('text-calls')

    await zulu.focus()
    await page.keyboard.type('b')
    await expect(bravo).toBeFocused()

    await page.waitForTimeout(1100)
    await page.keyboard.type('z')
    await expect(zulu).toBeFocused()

    // Decorative markup never matches
    await page.waitForTimeout(1100)
    await page.keyboard.type('q')
    await expect(zulu).toBeFocused()

    await expect(calls).toHaveText('[]')
  })
});
