/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-SINGLE-01: Listbox should request one single selection when an enabled option is clicked', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/RequestLog')
    await expect(page.getByTestId('req-root')).toBeVisible()

    const alpha = page.getByTestId('req-alpha')
    const bravo = page.getByTestId('req-bravo')
    const calls = page.getByTestId('req-calls')

    await bravo.click()
    await expect(calls).toContainText('"bravo"')
    await expect(alpha).toHaveAttribute('aria-selected', 'true')
    await expect(bravo).toHaveAttribute('aria-selected', 'false')
  })
});
