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
  test('CB-CUSTOM-02: blur commits custom text', async ({ mount, page }) => {
    await mount('components/Combobox/Combobox/CustomLog')
    const input = page.getByTestId('log-input')
    await input.click()
    await input.fill('New value')
    await page.getByTestId('log-clear').focus()
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(input).toHaveValue('New value')
    expect(await readLog(page, 'log-counts')).toEqual([
      'open',
      'input:New value',
      'change:New value',
      'dismiss',
    ])
  })
});
