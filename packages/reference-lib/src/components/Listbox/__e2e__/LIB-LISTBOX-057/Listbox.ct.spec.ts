/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-MULTI-04: Listbox should keep multiple selection unchanged during every focus-only movement', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/MultiToggle')
    await expect(page.getByTestId('mt-root')).toBeVisible()

    const alpha = page.getByTestId('mt-alpha')
    const bravo = page.getByTestId('mt-bravo')
    const charlie = page.getByTestId('mt-charlie')
    const calls = page.getByTestId('mt-calls')

    await alpha.focus()
    await page.keyboard.press('ArrowDown')
    await expect(bravo).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(charlie).toBeFocused()
    await page.keyboard.press('Home')
    await expect(alpha).toBeFocused()
    await page.keyboard.press('End')
    await expect(charlie).toBeFocused()
    await page.keyboard.type('b')
    await expect(bravo).toBeFocused()

    await expect(calls).toHaveText('[]')
    await expect(alpha).toHaveAttribute('aria-selected', 'true')
    await expect(bravo).toHaveAttribute('aria-selected', 'false')
    await expect(charlie).toHaveAttribute('aria-selected', 'true')
  })
});
