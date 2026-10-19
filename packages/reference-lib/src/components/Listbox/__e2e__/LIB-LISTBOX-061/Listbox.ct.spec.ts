/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-MULTI-08: Listbox should default omitted multiple value to a controlled empty array', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/MultiOmitted')
    await expect(page.getByTestId('mo-root')).toBeVisible()

    const alpha = page.getByTestId('mo-alpha')
    const calls = page.getByTestId('mo-calls')

    await alpha.click()
    await expect(calls).toHaveText('[["alpha"]]')
    await expect(alpha).toHaveAttribute('aria-selected', 'false')
    await expect(alpha).not.toHaveAttribute('data-selected')
    await expect(page.getByTestId('mo-bravo')).toHaveAttribute('aria-selected', 'false')
  })
});
