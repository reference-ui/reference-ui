/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-DOM-08: Listbox should choose one deterministic mounted option for initial Tab entry', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/RovingTab')
    await expect(page.getByTestId('roving-root')).toBeVisible()

    const alpha = page.getByTestId('roving-alpha')
    const charlie = page.getByTestId('roving-charlie')

    await expect(charlie).toHaveAttribute('tabindex', '0')
    await expect(alpha).toHaveAttribute('tabindex', '-1')

    await page.getByTestId('roving-set-null').click()
    await expect(alpha).toHaveAttribute('tabindex', '0')
    await expect(charlie).toHaveAttribute('tabindex', '-1')
  })
});
