/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-DYNAMIC-03: Listbox should not correct a controlled value when its selected option is removed', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/SelectedRemove')
    await expect(page.getByTestId('sr-root')).toBeVisible()

    const calls = page.getByTestId('sr-calls')

    await page.getByTestId('sr-outside').click()
    await page.getByTestId('sr-remove-bravo').click()
    await expect(page.getByTestId('sr-bravo')).toHaveCount(0)
    await expect(calls).toHaveText('[]')
    await expect(page.getByTestId('sr-alpha')).toHaveAttribute('aria-selected', 'false')
    await expect(page.getByTestId('sr-charlie')).toHaveAttribute('aria-selected', 'false')

    await page.getByTestId('sr-remount-bravo').click()
    await expect(page.getByTestId('sr-bravo')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('sr-bravo')).toHaveAttribute('data-selected', '')
    await expect(calls).toHaveText('[]')
  })
});
