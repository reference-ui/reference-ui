/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-DOM-03: Listbox options should mirror controlled selection in ARIA and data state', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/ControlledMirror')
    await expect(page.getByTestId('mirror-root')).toBeVisible()

    const alpha = page.getByTestId('mirror-alpha')
    const bravo = page.getByTestId('mirror-bravo')
    const charlie = page.getByTestId('mirror-charlie')
    const calls = page.getByTestId('mirror-calls')

    await expect(alpha).toHaveAttribute('aria-selected', 'false')
    await expect(bravo).toHaveAttribute('aria-selected', 'true')
    await expect(bravo).toHaveAttribute('data-selected', '')
    await expect(charlie).toHaveAttribute('aria-selected', 'false')

    await page.getByTestId('mirror-set-charlie').click()
    await expect(bravo).toHaveAttribute('aria-selected', 'false')
    await expect(bravo).not.toHaveAttribute('data-selected')
    await expect(charlie).toHaveAttribute('aria-selected', 'true')
    await expect(charlie).toHaveAttribute('data-selected', '')
    await expect(calls).toHaveText('0')
  })
});
