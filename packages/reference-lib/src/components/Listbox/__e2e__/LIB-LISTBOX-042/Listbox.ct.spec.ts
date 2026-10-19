/**
 * Listbox browser proofs: composition gates across DOM, single and
 * multiple selection, keyboard, pointer, and dynamic rows. Mounts the
 * story fixtures and asserts roving focus, typeahead, and one-request
 * selection in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Listbox behavior CT', () => {
  test('LB-DOM-07: Listbox should remain semantically empty without inventing a focus target', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/Listbox/Listbox/EmptyTab')
    await expect(page.getByTestId('empty-root')).toBeVisible()

    const listbox = page.getByTestId('empty-listbox')
    await expect(listbox).toHaveAttribute('role', 'listbox')
    await expect(listbox.getByRole('option')).toHaveCount(0)
    await expect(listbox).not.toHaveAttribute('tabindex')

    // WebKit skips buttons in
    // sequential Tab, so the button-to-button walk below cannot run
    // there; the contract (empty listbox never captures the walk) is
    // pinned with not-focused assertions instead.
    const isWebKit = browserName === 'webkit'

    // Skipped in tab order initially
    await page.getByTestId('empty-before').focus()
    await page.keyboard.press('Tab')
    if (isWebKit) {
      await expect(listbox).not.toBeFocused()
    } else {
      await expect(page.getByTestId('empty-toggle-tab')).toBeFocused()
    }
    await page.keyboard.press('Tab')
    if (isWebKit) {
      await expect(listbox).not.toBeFocused()
    } else {
      await expect(page.getByTestId('empty-after')).toBeFocused()
    }

    // Focusable only with the explicit consumer tab index
    await page.getByTestId('empty-toggle-tab').click()
    await expect(listbox).toHaveAttribute('tabindex', '0')
    if (isWebKit) {
      // Click never focused the toggle and Tab never lands on buttons;
      // seed focus behind the listbox so Shift+Tab proves the explicit
      // tabindex stop (probe: lands on empty-listbox).
      await page.getByTestId('empty-after').focus()
    }
    await page.keyboard.press('Shift+Tab')
    await expect(listbox).toBeFocused()
  })
});
