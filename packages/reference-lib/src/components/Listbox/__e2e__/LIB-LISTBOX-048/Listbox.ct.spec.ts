/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-GROUP-03: Listbox typeahead should cross native group boundaries while excluding group labels', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/NativeGroups')
    await expect(page.getByTestId('ng-root')).toBeVisible()

    const apple = page.getByTestId('ng-apple')
    const zulu = page.getByTestId('ng-zulu')
    const calls = page.getByTestId('ng-calls')

    // 'z' crosses groups to the Zulu option (not the "Zulu region" label)
    await apple.focus()
    await page.keyboard.type('z')
    await expect(zulu).toBeFocused()

    // Decorative "Bravo" text and group labels never match
    await page.waitForTimeout(1100)
    await page.keyboard.type('b')
    await expect(zulu).toBeFocused()

    // Repeated "a" wraps back to the only enabled A option across groups
    await page.waitForTimeout(1100)
    await page.keyboard.type('a')
    await expect(apple).toBeFocused()
    await page.keyboard.type('a')
    await expect(apple).toBeFocused()

    await expect(calls).toHaveText('[]')
  })
});
