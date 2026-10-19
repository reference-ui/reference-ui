/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

async function readLog(page: Page, testid: string): Promise<string[]> {
  const text = await page.getByTestId(testid).textContent()
  return JSON.parse(text ?? '[]')
}

test.describe('Combobox text restore, dialog blur, and custom value CT', () => {
  test('unmatched pointer blur inside a dialog reverts, closes, and keeps the trap', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/DialogCombo')
    await page.getByTestId('dlgcombo-open').click()
    const dialog = page.getByTestId('dlgcombo-dialog')
    await expect(dialog).toBeVisible()

    // Pointer blur onto another dialog field: unmatched text reverts and
    // the popup closes, while the dialog stays open.
    const room = page.getByTestId('dlgcombo-room-input')
    await room.click()
    await expect(page.getByTestId('dlgcombo-room-borealis')).toBeVisible()
    await page.keyboard.type('zzz')
    await expect(room).toHaveValue('zzz')
    await page.getByTestId('dlgcombo-title-input').click()
    await expect(room).toHaveAttribute('aria-expanded', 'false')
    await expect(room).toHaveValue('')
    await expect(page.getByTestId('dlgcombo-title-input')).toBeFocused()
    await expect(dialog).toBeVisible()
    expect(await readLog(page, 'dlgcombo-log')).toEqual([
      'open',
      'input:z',
      'input:zz',
      'input:zzz',
      'input:',
      'dismiss',
    ])

    // Backward trap wrap still lands inside the dialog, never in the list.
    await page.keyboard.press('Shift+Tab')
    await expect(page.getByTestId('dlgcombo-cancel')).toBeFocused()
    const activeRole = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.getAttribute('role')
    )
    expect(activeRole).not.toBe('option')
  })
});
