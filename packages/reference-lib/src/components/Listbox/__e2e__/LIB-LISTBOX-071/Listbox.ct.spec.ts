/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-VIRT-04: Virtual Listbox should make Home and End target logical boundaries outside the window', async ({
    mount,
    page,
  }) => {
    const first = await mount('components/Listbox/Listbox/Virtual')
    await expect(page.getByTestId('virt-root')).toBeVisible()

    // Home targets first enabled logical index 1 (0 is disabled)
    await page.getByTestId('virt-opt-22').focus()
    await page.keyboard.press('Home')
    await expect(page.getByTestId('virt-scroll-log')).toHaveText('[1]')
    await page.getByTestId('virt-mount-0-4').click()
    await expect(page.getByTestId('virt-opt-1')).toBeFocused()
    await expect(page.getByTestId('virt-value')).toHaveText('null')

    // End targets last enabled logical index 48 (49 is disabled) in a fresh run
    await first.unmount()
    await mount('components/Listbox/Listbox/Virtual')
    await expect(page.getByTestId('virt-root')).toBeVisible()
    await page.getByTestId('virt-opt-22').focus()
    await page.keyboard.press('End')
    await expect(page.getByTestId('virt-scroll-log')).toHaveText('[48]')
    await page.getByTestId('virt-mount-45-49').click()
    await expect(page.getByTestId('virt-opt-48')).toBeFocused()
    await expect(page.getByTestId('virt-value')).toHaveText('null')
  })
});
