/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-KEY-05: Listbox should treat Space as typeahead text only while a search buffer is active', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Typeahead')
    await expect(page.getByTestId('type-root')).toBeVisible()

    const ny = page.getByTestId('type-ny')
    const calls = page.getByTestId('type-calls')

    await ny.focus()
    await page.keyboard.type('New Y ')
    await expect(calls).toHaveText('[]')

    await page.waitForTimeout(1100)

    await page.keyboard.press('Space')
    await expect(calls).toContainText('"new-york"')
  })
});
