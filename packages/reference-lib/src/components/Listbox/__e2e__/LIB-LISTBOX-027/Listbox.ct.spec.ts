/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-KEY-02: Horizontal LTR Listbox should move with Left and Right while preserving native vertical keys', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Horizontal')
    await expect(page.getByTestId('horiz-root')).toBeVisible()

    const alpha = page.getByTestId('horiz-alpha')
    const bravo = page.getByTestId('horiz-bravo')
    const charlie = page.getByTestId('horiz-charlie')

    await bravo.focus()
    await page.keyboard.press('ArrowRight')
    await expect(charlie).toBeFocused()

    await page.keyboard.press('ArrowLeft')
    await expect(bravo).toBeFocused()

    await page.keyboard.press('ArrowLeft')
    await expect(alpha).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(alpha).toBeFocused()
  })
});
