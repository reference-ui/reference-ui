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
  test('closeOnBlur=false inside a dialog preserves open text and the trap', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/DialogComboPersist')
    await page.getByTestId('dlgcombo-open').click()
    await expect(page.getByTestId('dlgcombo-dialog')).toBeVisible()

    const room = page.getByTestId('dlgcombo-room-input')
    await room.click()
    await page.keyboard.type('zzz')
    await page.getByTestId('dlgcombo-seats-input').focus()
    await expect(page.getByTestId('dlgcombo-seats-input')).toBeFocused()
    await expect(room).toHaveAttribute('aria-expanded', 'true')
    await expect(room).toHaveValue('zzz')
    expect(await readLog(page, 'dlgcombo-log')).toEqual([
      'open',
      'input:z',
      'input:zz',
      'input:zzz',
    ])

    // Tab traversal with the popup open wraps inside the dialog.
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('dlgcombo-cancel')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('dlgcombo-title-input')).toBeFocused()
    await expect(room).toHaveAttribute('aria-expanded', 'true')
    const activeRole = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.getAttribute('role')
    )
    expect(activeRole).not.toBe('option')
  })
});
