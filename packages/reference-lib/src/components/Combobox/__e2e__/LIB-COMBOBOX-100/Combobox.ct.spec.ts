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
  test('CB-OPEN-01: ArrowDown requests open without disturbing focus or text', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/FixedClosed')

    const input = page.getByTestId('fixed-input')
    await input.focus()
    // #11: focus never requests open.
    expect(await readLog(page, 'fixed-log')).toEqual([])
    await expect(input).toHaveAttribute('aria-expanded', 'false')

    await page.keyboard.press('ArrowDown')
    // ArrowDown adds exactly one request; focus and text are undisturbed.
    expect(await readLog(page, 'fixed-log')).toEqual(['open'])
    await expect(input).toBeFocused()
    await expect(input).toHaveValue('Hello')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('fixed-popover')).toHaveCount(0)
  })
});
