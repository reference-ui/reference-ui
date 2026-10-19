/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-DYNAMIC-06: Listbox should use current option labels and text values after descendants rerender', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/DynamicLabel')
    await expect(page.getByTestId('dl-root')).toBeVisible()

    const alpha = page.getByTestId('dl-alpha')
    const mango = page.getByTestId('dl-mango')
    const calls = page.getByTestId('dl-calls')

    // Current rendered label drives typeahead after the rerender
    await page.getByTestId('dl-to-zulu').click()
    await expect(alpha).toContainText('Zulu')
    await mango.focus()
    await page.keyboard.type('z')
    await expect(alpha).toBeFocused()

    await page.waitForTimeout(1100)
    await mango.focus()
    await page.keyboard.type('a')
    await expect(mango).toBeFocused()

    // Explicit textValue then shadows the rendered label
    await page.waitForTimeout(1100)
    await page.getByTestId('dl-explicit-bravo').click()
    await mango.focus()
    await page.keyboard.type('b')
    await expect(alpha).toBeFocused()

    await page.waitForTimeout(1100)
    await mango.focus()
    await page.keyboard.type('z')
    await expect(mango).toBeFocused()

    await expect(alpha).toHaveAttribute('aria-selected', 'true')
    await expect(calls).toHaveText('[]')
  })
});
