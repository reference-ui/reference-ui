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
  test('CB-COMMIT-03 headers: section headers are not options', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SectionLog')

    const input = page.getByTestId('sc-input')
    const popover = page.getByTestId('sc-popover')
    await input.click()
    await expect(popover).toBeVisible()

    // Clicking a section header produces nothing and leaves the popover
    // open with focus on the source.
    const header = popover.locator('[data-reference-listbox-header]').first()
    await header.click()
    await expect(popover).toBeVisible()
    await expect(input).toHaveAttribute('aria-expanded', 'true')
    await expect(input).toBeFocused()
    expect(await readLog(page, 'sc-log')).toEqual(['open'])

    // Options beside the headers still commit once.
    await page.getByTestId('sc-opt-bravo').click()
    expect(await readLog(page, 'sc-log')).toEqual(['open', 'change:bravo', 'dismiss'])
    await expect(popover).toHaveCount(0)
  })
});
