/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-KEY-03: Horizontal RTL Listbox should reverse its Left and Right movement', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/HorizontalRTL')
    await expect(page.getByTestId('rtl-root')).toBeVisible()

    const alpha = page.getByTestId('rtl-alpha')
    const bravo = page.getByTestId('rtl-bravo')
    const charlie = page.getByTestId('rtl-charlie')

    await bravo.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(charlie).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(bravo).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(alpha).toBeFocused()
  })
});
