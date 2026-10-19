/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-VIRT-02: Virtual Listbox options should expose position metadata for the complete logical set', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Virtual')
    await expect(page.getByTestId('virt-root')).toBeVisible()

    await page.getByTestId('virt-mount-0-4').click()
    await expect(page.getByTestId('virt-opt-0')).toHaveAttribute('aria-setsize', '50')
    await expect(page.getByTestId('virt-opt-0')).toHaveAttribute('aria-posinset', '1')
    await expect(page.getByTestId('virt-opt-4')).toHaveAttribute('aria-posinset', '5')
  })
});
