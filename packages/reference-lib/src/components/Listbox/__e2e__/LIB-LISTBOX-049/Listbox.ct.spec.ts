/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-GROUP-04: Listbox should recompute flattened order when Options move between native groups', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/GroupedDynamic')
    await expect(page.getByTestId('gd-root')).toBeVisible()

    const calls = page.getByTestId('gd-calls')

    await page.getByTestId('gd-bravo').focus()
    await page.keyboard.press('ArrowUp')
    await expect(page.getByTestId('gd-alpha')).toBeFocused()

    // Insert a group and move bravo into it: focus + selection follow identity
    await page.getByTestId('gd-bravo').focus()
    await page.getByTestId('gd-layout-1').click()
    await expect(page.getByTestId('gd-bravo')).toBeFocused()
    await expect(page.getByTestId('gd-bravo')).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowUp')
    await expect(page.getByTestId('gd-alpha')).toBeFocused()

    // Reorder groups and drop alpha: navigation follows the latest DOM order
    await page.getByTestId('gd-bravo').focus()
    await page.getByTestId('gd-layout-2').click()
    await expect(page.getByTestId('gd-bravo')).toBeFocused()
    await expect(page.getByTestId('gd-alpha')).toHaveCount(0)
    await page.keyboard.press('ArrowUp')
    await expect(page.getByTestId('gd-charlie')).toBeFocused()
    await expect(page.getByTestId('gd-bravo')).toHaveAttribute('aria-selected', 'true')

    await expect(calls).toHaveText('[]')
  })
});
