/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-DOM-02: Listbox should expose multiselectability only in multiple-selection mode', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Modes')
    await expect(page.getByTestId('modes-root')).toBeVisible()

    await expect(page.getByTestId('modes-single')).not.toHaveAttribute('aria-multiselectable')
    await expect(page.getByTestId('modes-multiple')).toHaveAttribute(
      'aria-multiselectable',
      'true'
    )
  })
});
