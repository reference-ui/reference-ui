/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-GROUP-02: Listbox should flatten grouped and ungrouped Options in current composed DOM order', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/GroupedOrder')
    await expect(page.getByTestId('go-root')).toBeVisible()

    const alpha = page.getByTestId('go-alpha')
    const bravo = page.getByTestId('go-bravo')
    const delta = page.getByTestId('go-delta')
    const echo = page.getByTestId('go-echo')
    const calls = page.getByTestId('go-calls')

    await page.getByTestId('go-before').focus()
    await page.keyboard.press('Tab')
    await expect(alpha).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(bravo).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(delta).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(echo).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(alpha).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(echo).toBeFocused()
    await page.keyboard.press('Home')
    await expect(alpha).toBeFocused()
    await page.keyboard.press('End')
    await expect(echo).toBeFocused()

    await expect(page.getByTestId('go-listbox').locator('[tabindex="0"]')).toHaveCount(1)
    await expect(calls).toHaveText('[]')
  })
});
