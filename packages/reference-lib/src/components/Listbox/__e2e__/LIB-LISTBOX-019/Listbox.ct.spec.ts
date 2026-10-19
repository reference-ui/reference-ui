/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-DOM-06: Listbox should preserve empty and zero-like string identities', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/ZeroValues')
    await expect(page.getByTestId('zero-root')).toBeVisible()

    const optEmpty = page.getByTestId('zero-opt-empty')
    const optZero = page.getByTestId('zero-opt-zero')
    const valDisplay = page.getByTestId('zero-val')

    await page.getByTestId('zero-set-empty').click()
    await expect(optEmpty).toHaveAttribute('aria-selected', 'true')
    await expect(optZero).toHaveAttribute('aria-selected', 'false')
    await expect(valDisplay).toHaveText('')

    await page.getByTestId('zero-set-zero').click()
    await expect(optEmpty).toHaveAttribute('aria-selected', 'false')
    await expect(optZero).toHaveAttribute('aria-selected', 'true')
    await expect(valDisplay).toHaveText('0')
  })
});
