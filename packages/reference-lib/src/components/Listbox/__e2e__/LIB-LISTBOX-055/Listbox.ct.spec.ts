/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-SINGLE-07: Listbox should adopt a programmatically selected mounted option without emitting a request', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/ProgSelect')
    await expect(page.getByTestId('ps-root')).toBeVisible()

    const charlie = page.getByTestId('ps-charlie')
    const calls = page.getByTestId('ps-calls')

    await page.getByTestId('ps-outside').click()
    await page.getByTestId('ps-set-charlie').click()
    await expect(charlie).toHaveAttribute('aria-selected', 'true')
    await expect(charlie).toHaveAttribute('data-selected', '')
    await expect(calls).toHaveText('[]')
    await expect(charlie).toHaveAttribute('tabindex', '0')
    await expect(page.getByTestId('ps-alpha')).toHaveAttribute('tabindex', '-1')

    await page.keyboard.press('Tab')
    await expect(charlie).toBeFocused()
  })
});
