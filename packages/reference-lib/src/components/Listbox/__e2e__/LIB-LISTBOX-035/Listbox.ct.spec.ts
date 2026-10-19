/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-VIRT-03: Virtual Listbox should scroll before focusing the next unmounted logical option', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Virtual')
    await expect(page.getByTestId('virt-root')).toBeVisible()

    await page.getByTestId('virt-mount-0-4').click()
    const opt4 = page.getByTestId('virt-opt-4')
    const scrollLog = page.getByTestId('virt-scroll-log')

    await opt4.focus()
    await page.keyboard.press('ArrowDown')
    await expect(scrollLog).toContainText('5')

    await page.getByTestId('virt-mount-5-10').click()
    await expect(page.getByTestId('virt-opt-5')).toBeFocused()
  })
});
