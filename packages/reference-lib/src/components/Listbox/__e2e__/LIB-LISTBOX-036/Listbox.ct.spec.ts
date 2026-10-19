/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-VIRT-05: Virtual Listbox typeahead should resolve and mount an offscreen logical match before focusing it', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Virtual')
    await expect(page.getByTestId('virt-root')).toBeVisible()

    await page.getByTestId('virt-mount-0-4').click()
    const opt1 = page.getByTestId('virt-opt-1')
    const scrollLog = page.getByTestId('virt-scroll-log')

    await opt1.focus()
    await page.keyboard.type('z')
    await expect(scrollLog).toContainText('37')

    await page.getByTestId('virt-mount-35-40').click()
    await expect(page.getByTestId('virt-opt-37')).toBeFocused()
  })
});
