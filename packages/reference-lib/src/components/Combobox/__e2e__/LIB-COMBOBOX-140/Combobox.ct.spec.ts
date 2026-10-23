/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

async function logOf(page: Page, testid: string): Promise<string[]> {
  return JSON.parse((await page.getByTestId(testid).textContent()) ?? '[]')
}

test.describe('Combobox cluster B CT', () => {
  test('CB-OPEN-03 empty: edits never request open without collection content', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/EmptyPopoverLog')
    const emptyInput = page.getByTestId('eo-input')
    await emptyInput.focus()
    await emptyInput.pressSequentially('a')
    expect(await logOf(page, 'eo-log')).toEqual(['input:a'])
    await expect(emptyInput).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('eo-popover')).toHaveCount(0)

    await mount('components/Combobox/Combobox/NoPopoverLog')
    const bareInput = page.getByTestId('np-input')
    await bareInput.focus()
    await bareInput.pressSequentially('a')
    expect(await logOf(page, 'np-log')).toEqual(['input:a'])
    await expect(bareInput).toHaveAttribute('aria-expanded', 'false')
  })
});
