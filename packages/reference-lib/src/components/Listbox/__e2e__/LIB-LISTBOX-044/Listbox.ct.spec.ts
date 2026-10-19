/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-DOM-11: Listbox should represent a controlled selected-disabled option without making it interactive', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/SelectedDisabled')
    await expect(page.getByTestId('sd-root')).toBeVisible()

    const alpha = page.getByTestId('sd-alpha')
    const bravo = page.getByTestId('sd-bravo')
    const calls = page.getByTestId('sd-calls')

    await expect(bravo).toHaveAttribute('aria-selected', 'true')
    await expect(bravo).toHaveAttribute('data-selected', '')
    await expect(bravo).toHaveAttribute('aria-disabled', 'true')
    await expect(bravo).toHaveAttribute('data-disabled', '')
    await expect(bravo).toHaveAttribute('tabindex', '-1')

    await page.getByTestId('sd-before').focus()
    await page.keyboard.press('Tab')
    await expect(alpha).toBeFocused()

    await page.keyboard.type('b')
    await expect(alpha).toBeFocused()

    await bravo.click({ force: true })
    await expect(alpha).toBeFocused()
    await expect(calls).toHaveText('[]')

    await bravo.evaluate(el => (el as HTMLElement).focus())
    await page.keyboard.press('Enter')
    await expect(calls).toHaveText('[]')
    await expect(bravo).toHaveAttribute('aria-selected', 'true')
    await expect(bravo).toHaveAttribute('aria-disabled', 'true')
  })
});
