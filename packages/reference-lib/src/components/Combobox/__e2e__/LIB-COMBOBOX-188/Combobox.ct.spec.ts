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

test.describe('Combobox virtual listbox and tree bridge CT', () => {
  test('CB-EDIT-07: rejected keystrokes keep the caret clamped and usable', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/CaretRejectLog')

    const input = page.getByTestId('cr-input')
    await input.click()
    await expect(page.getByTestId('cr-popover')).toBeVisible()
    await input.evaluate(el => (el as HTMLInputElement).setSelectionRange(3, 3))
    await page.keyboard.type('x')

    // One text request for the native result; the DOM restores to the
    // controlled text with a clamped, usable caret; no commit.
    expect(await readLog(page, 'cr-log')).toEqual(['open', 'input:Alpxha'])
    await expect(input).toHaveValue('Alpha')
    const caret = await input.evaluate(el => ({
      start: (el as HTMLInputElement).selectionStart,
      end: (el as HTMLInputElement).selectionEnd,
    }))
    expect(caret.start).toBeGreaterThanOrEqual(0)
    expect(caret.start).toBeLessThanOrEqual(5)
    expect(caret.end).toBeGreaterThanOrEqual(0)
    expect(caret.end).toBeLessThanOrEqual(5)
    await expect(input).toBeFocused()

    // The caret stays usable after the restore.
    await input.evaluate(el => (el as HTMLInputElement).setSelectionRange(2, 4))
    expect(
      await input.evaluate(el => [
        (el as HTMLInputElement).selectionStart,
        (el as HTMLInputElement).selectionEnd,
      ])
    ).toEqual([2, 4])
  })
});
