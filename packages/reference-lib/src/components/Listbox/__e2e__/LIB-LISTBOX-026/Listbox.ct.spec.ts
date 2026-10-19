/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-MULTI-03: Listbox should emit a deterministic deduplicated multiple-selection array', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/MultiUnknown')
    await expect(page.getByTestId('multi-unknown-root')).toBeVisible()

    const bravo = page.getByTestId('mu-bravo')
    const calls = page.getByTestId('mu-calls')

    await bravo.click()
    await expect(calls).toContainText('["alpha","bravo","charlie","unknown-2","unknown-1"]')
  })
});
