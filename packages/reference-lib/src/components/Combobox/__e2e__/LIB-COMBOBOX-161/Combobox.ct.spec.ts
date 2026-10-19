/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

test.describe('Combobox text restore, dialog blur, and custom value CT', () => {
  test('combobox in a dialog closes on blur and never breaks the trap', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/DialogCombo')
    await page.getByTestId('dlgcombo-open').click()
    const dialog = page.getByTestId('dlgcombo-dialog')
    await expect(dialog).toBeVisible()

    // Popup closes on Tab out of the room input, like outside dialogs.
    const room = page.getByTestId('dlgcombo-room-input')
    await room.click()
    await expect(page.getByTestId('dlgcombo-room-borealis')).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(room).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('dlgcombo-seats-input')).toBeFocused()

    // Tab on to Cancel, then Tab from Cancel wraps inside the dialog —
    // never into a list option. (Clicking Cancel would activate it and
    // close the dialog; the trap repro Tabs through.)
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('dlgcombo-cancel')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('dlgcombo-title-input')).toBeFocused()
    const activeRole = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.getAttribute('role')
    )
    expect(activeRole).not.toBe('option')
  })
});
