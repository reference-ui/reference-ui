/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-DOM-04: Listbox should keep disabled options out of every interactive path', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/DisabledPaths')
    await expect(page.getByTestId('dis-root')).toBeVisible()

    const alpha = page.getByTestId('dis-alpha')
    const bravo = page.getByTestId('dis-bravo')
    const charlie = page.getByTestId('dis-charlie')
    const calls = page.getByTestId('dis-calls')

    await expect(bravo).toHaveAttribute('aria-disabled', 'true')
    await expect(bravo).toHaveAttribute('data-disabled', '')
    await expect(bravo).toHaveAttribute('tabindex', '-1')

    // Tab entry skips the disabled option
    await page.getByTestId('dis-before').focus()
    await page.keyboard.press('Tab')
    await expect(alpha).toBeFocused()

    // Pointer activation: no focus steal, no request (forced: Playwright
    // gates aria-disabled clicks, so force simulates the OS-level press)
    await bravo.click({ force: true })
    await expect(alpha).toBeFocused()
    await expect(calls).toHaveText('[]')

    // Arrow navigation skips the disabled option
    await page.keyboard.press('ArrowDown')
    await expect(charlie).toBeFocused()

    // Typeahead never matches the disabled option
    await page.keyboard.type('b')
    await expect(charlie).toBeFocused()
    await expect(calls).toHaveText('[]')

    // Programmatic focus + Space/Enter: still no request
    await bravo.evaluate(el => (el as HTMLElement).focus())
    await page.keyboard.press('Space')
    await page.keyboard.press('Enter')
    await expect(calls).toHaveText('[]')
    await bravo.evaluate(el => (el as HTMLElement).blur())

    // Exactly one roving tab stop, never on the disabled option
    await expect(page.getByTestId('dis-listbox').locator('[tabindex="0"]')).toHaveCount(1)
    await expect(charlie).toHaveAttribute('tabindex', '0')
    await expect(bravo).toHaveAttribute('tabindex', '-1')
  })
});
