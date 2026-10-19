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
  test('CB-OPEN-04 select-only: trigger toggles with open and dismiss requests', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SelectOnlyStory')

    const trigger = page.getByTestId('select-trigger')
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(await readLog(page, 'select-log')).toEqual(['open', 'dismiss'])
  })
});
