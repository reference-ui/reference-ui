/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-SINGLE-08: Listbox should let consumer handlers cancel option selection before its default runs', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Cancel')
    await expect(page.getByTestId('cancel-root')).toBeVisible()

    const bravo = page.getByTestId('cancel-bravo')
    const calls = page.getByTestId('cancel-calls')
    const log = page.getByTestId('cancel-log')

    await bravo.click()
    await expect(log).toContainText('consumer-click')
    await expect(calls).toHaveText('0')

    await bravo.focus()
    await page.keyboard.press('Enter')
    await expect(log).toContainText('consumer-keydown-Enter')
    await expect(calls).toHaveText('0')
  })
});
