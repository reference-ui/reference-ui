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
  test('CB-CUSTOM-01 false / CB-COMMIT-02: Enter with no active reverts and dismisses without a value', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/NoCustomLog')
    const input = page.getByTestId('log-input')
    await input.click()
    await input.fill('Zen Den')
    await expect(page.getByTestId('log-opt-alpha')).toHaveCount(0)

    await page.keyboard.press('Enter')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(input).toHaveValue('Bravo')
    const log = await readLog(page, 'log-counts')
    expect(log.filter(e => e.startsWith('change:'))).toEqual([])
    expect(log).toEqual(['open', 'input:Zen Den', 'input:Bravo', 'dismiss'])
  })
});
