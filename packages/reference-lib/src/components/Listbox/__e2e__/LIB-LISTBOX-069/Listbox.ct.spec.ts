/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-DYNAMIC-05: Listbox should replace an option registration when its value changes', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/DynamicValue')
    await expect(page.getByTestId('dv-root')).toBeVisible()

    const calls = page.getByTestId('dv-calls')

    await page.getByTestId('dv-to-delta').click()
    await expect(page.getByTestId('dv-middle')).toHaveAttribute('data-value', 'delta')
    await expect(page.locator('[data-value="bravo"]')).toHaveCount(0)

    await page.getByTestId('dv-alpha').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('dv-middle')).toBeFocused()

    await page.getByTestId('dv-middle').click()
    await expect(calls).toHaveText('["delta"]')

    await page.getByTestId('dv-collide').click()
    await expect(page.getByTestId('dv-error')).toContainText('Duplicate option value "delta"')
  })
});
