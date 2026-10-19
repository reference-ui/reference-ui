/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-MULTI-07: Listbox should retain controlled disabled and unmounted values without activating them', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/MultiRetained')
    await expect(page.getByTestId('mr-root')).toBeVisible()

    const disabled = page.getByTestId('mr-disabled')
    const calls = page.getByTestId('mr-calls')

    await expect(disabled).toHaveAttribute('aria-selected', 'true')
    await expect(disabled).toHaveAttribute('aria-disabled', 'true')
    await expect(disabled).toHaveAttribute('data-selected', '')
    await expect(disabled).toHaveAttribute('data-disabled', '')

    // Every activation modality fails against the disabled option
    await disabled.click({ force: true })
    await page.getByTestId('mr-alpha').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('mr-bravo')).toBeFocused()
    await page.keyboard.type('d')
    await expect(page.getByTestId('mr-bravo')).toBeFocused()
    await disabled.evaluate(el => (el as HTMLElement).focus())
    await page.keyboard.press('Space')
    await page.keyboard.press('Enter')
    await expect(calls).toHaveText('[]')

    // No hidden option is invented for the offscreen value
    await expect(page.locator('[data-value="offscreen"]')).toHaveCount(0)

    // A request still carries the retained values through
    await page.getByTestId('mr-alpha').click()
    await expect(calls).toHaveText('[["alpha","disabled","offscreen"]]')
  })
});
