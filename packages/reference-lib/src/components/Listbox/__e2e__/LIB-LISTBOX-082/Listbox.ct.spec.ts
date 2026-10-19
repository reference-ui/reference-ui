/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-COMP-01: Standalone Listbox should support a complete controlled single-select composition', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/CompSingle')
    await expect(page.getByTestId('cs-root')).toBeVisible()

    const listbox = page.getByTestId('cs-listbox')
    const calls = page.getByTestId('cs-calls')

    await page.getByTestId('cs-before').focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('cs-alpha')).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('cs-bravo')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('cs-delta')).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(page.getByTestId('cs-bravo')).toBeFocused()

    await page.keyboard.type('d')
    await expect(page.getByTestId('cs-delta')).toBeFocused()

    await page.getByTestId('cs-bravo').click()
    await expect(calls).toHaveText('["bravo"]')
    await expect(page.getByTestId('cs-bravo')).toHaveAttribute('aria-selected', 'true')

    // Let the typeahead buffer from the 'd' phase expire so Space selects
    await page.waitForTimeout(1100)
    await page.getByTestId('cs-delta').focus()
    await page.keyboard.press('Space')
    await expect(calls).toHaveText('["bravo","delta"]')

    // Deterministic focus recovery after removal; one tab stop throughout
    await page.getByTestId('cs-bravo').focus()
    await page.getByTestId('cs-remove-bravo').click()
    await expect(page.getByTestId('cs-delta')).toBeFocused()
    await expect(listbox.locator('[tabindex="0"]')).toHaveCount(1)

    // No popup or form markup in the standalone composition
    await expect(listbox.locator('[role="dialog"],[role="menu"],form,input,select')).toHaveCount(
      0
    )
  })
});
