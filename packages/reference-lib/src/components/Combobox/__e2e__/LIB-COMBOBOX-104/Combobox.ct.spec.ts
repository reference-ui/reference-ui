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

test.describe('Combobox reconciliation CT', () => {
  test('CB-OPEN-08: readOnly and disabled sources never request open', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/DisabledReadonly')

    const readonly = page.getByTestId('dr-readonly')
    await readonly.click()
    await readonly.focus()
    await page.keyboard.press('ArrowDown')
    expect(await readLog(page, 'dr-log')).toEqual([])

    // Disabled sources are inert: no focus, no click, no request.
    await page.getByTestId('dr-disabled').focus()
    await expect(page.getByTestId('dr-disabled')).not.toBeFocused()
    expect(await readLog(page, 'dr-log')).toEqual([])
  })
});
