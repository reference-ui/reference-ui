/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-VIRT-07: Virtual Listbox should preserve an offscreen controlled selection until its option mounts', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Virtual')
    await expect(page.getByTestId('virt-root')).toBeVisible()

    await page.getByTestId('virt-mount-0-4').click()
    await page.getByTestId('virt-set-37').click()

    await expect(page.getByTestId('virt-opt-37')).toHaveCount(0)

    await page.getByTestId('virt-mount-35-40').click()
    const opt37 = page.getByTestId('virt-opt-37')
    await expect(opt37).toHaveAttribute('aria-selected', 'true')
    await expect(opt37).toHaveAttribute('data-selected', '')
  })
});
