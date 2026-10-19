/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-KEY-07: Listbox should ignore composite keyboard commands originating in interactive descendants', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Descendants')
    await expect(page.getByTestId('desc-root')).toBeVisible()

    const input = page.getByTestId('desc-input')
    const button = page.getByTestId('desc-button')
    const calls = page.getByTestId('desc-calls')

    await page.getByTestId('desc-alpha').focus()
    await input.click()
    await input.pressSequentially('hi')
    await expect(page.getByTestId('desc-text')).toHaveText('hi')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Home')
    await expect(input).toBeFocused()
    await expect(page.getByTestId('desc-alpha')).toHaveAttribute('tabindex', '0')
    await expect(page.getByTestId('desc-bravo')).toHaveAttribute('tabindex', '-1')
    await expect(calls).toHaveText('[]')

    await button.focus()
    await page.keyboard.press('Space')
    await expect(page.getByTestId('desc-clicks')).toHaveText('1')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('desc-clicks')).toHaveText('2')
    await expect(calls).toHaveText('[]')
    await expect(page.getByTestId('desc-alpha')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('desc-bravo')).toHaveAttribute('aria-selected', 'false')
  })
});
