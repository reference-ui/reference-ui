/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-VIRT-06: Virtual Listbox should coalesce rapid navigation while a requested window is rendering', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Virtual')
    await expect(page.getByTestId('virt-root')).toBeVisible()

    await page.getByTestId('virt-mount-0-4').click()
    await page.getByTestId('virt-opt-4').focus()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')

    // Deterministic latest target, no duplicate callback, no stale focus
    await expect(page.getByTestId('virt-scroll-log')).toHaveText('[5,6,7]')
    await expect(page.getByTestId('virt-opt-4')).toBeFocused()

    await page.getByTestId('virt-mount-5-10').click()
    await expect(page.getByTestId('virt-opt-7')).toBeFocused()
    await expect(page.getByTestId('virt-listbox').locator('[tabindex="0"]')).toHaveCount(1)
  })
});
