/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-MULTI-06: Listbox should keep multiple selection fully controlled across rejection and programmatic updates', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/MultiFive')
    await expect(page.getByTestId('m5-root')).toBeVisible()

    const alpha = page.getByTestId('m5-alpha')
    const calls = page.getByTestId('m5-calls')

    // Rejected request never changes ARIA
    await alpha.click()
    await expect(calls).toHaveText('[["alpha","bravo"]]')
    await expect(page.getByTestId('m5-bravo')).toHaveAttribute('aria-selected', 'true')
    await expect(alpha).toHaveAttribute('aria-selected', 'false')

    // Programmatic rerender updates ARIA without firing onChange
    await page.getByTestId('m5-set-charlie').click()
    await expect(calls).toHaveText('[["alpha","bravo"]]')
    await expect(page.getByTestId('m5-charlie')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('m5-bravo')).toHaveAttribute('aria-selected', 'false')
    await expect(alpha).toBeFocused()
  })
});
