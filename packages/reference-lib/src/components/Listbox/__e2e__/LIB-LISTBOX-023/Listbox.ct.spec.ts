/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-SINGLE-04: Listbox should not select merely because arrows move focus', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/RequestLog')
    await expect(page.getByTestId('req-root')).toBeVisible()

    const alpha = page.getByTestId('req-alpha')
    const bravo = page.getByTestId('req-bravo')
    const calls = page.getByTestId('req-calls')

    await alpha.focus()
    await page.keyboard.press('ArrowDown')
    await expect(bravo).toBeFocused()
    await expect(calls).toHaveText('[]')
    await expect(alpha).toHaveAttribute('aria-selected', 'true')
  })
});
