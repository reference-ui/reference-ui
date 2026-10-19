/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox Composition Gates & Browser Proofs', () => {
  test('LB-DOM-10: Listbox should apply controlled single-null-vertical defaults when behavior props are omitted', async ({
    mount,
    page,
  }) => {
    await mount('components/Listbox/Listbox/Defaults')
    await expect(page.getByTestId('defaults-root')).toBeVisible()

    const listbox = page.getByTestId('defaults-listbox')
    const alpha = page.getByTestId('defaults-alpha')
    const calls = page.getByTestId('defaults-calls')

    await expect(listbox).toHaveAttribute('aria-orientation', 'vertical')
    await expect(listbox).not.toHaveAttribute('aria-multiselectable')

    await alpha.focus()
    await page.keyboard.press('Space')
    await expect(calls).toContainText('"alpha"')
    await expect(alpha).toHaveAttribute('aria-selected', 'false')
  })
});
