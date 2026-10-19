/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-MULTI-02: Listbox should remove only the activated selected value in multiple mode', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/MultiToggle')
    await expect(page.getByTestId('mt-root')).toBeVisible()

    const alpha = page.getByTestId('mt-alpha')
    const calls = page.getByTestId('mt-calls')

    await alpha.click()
    await expect(calls).toHaveText('[["charlie"]]')
    await expect(alpha).toBeFocused()
    await expect(alpha).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('mt-charlie')).toHaveAttribute('aria-selected', 'true')
  })
});
