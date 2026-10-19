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

async function expectActiveDescendant(source: Locator, option: Locator) {
  const id = await option.getAttribute('id')
  expect(id).toBeTruthy()
  await expect(source).toHaveAttribute('aria-activedescendant', id!)
}

test.describe('Combobox virtual listbox and tree bridge CT', () => {
  test('CB-ENV-02: strict mode issues one request per user action across the gate', async ({
    mount,
    page,
  }) => {
    // Runs under --react 17/18/19 (suite matrix); effect replay must not
    // duplicate registrations, text requests, commits, or dismissals.
    await mount('components/Combobox/Combobox/StrictLog')

    const input = page.getByTestId('st-input')
    const popover = page.getByTestId('st-popover')
    await input.click()
    await expect(popover).toBeVisible()
    await page.keyboard.type('a')
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, page.getByTestId('st-opt-bravo'))
    await page.keyboard.press('Enter')
    expect(await readLog(page, 'st-log')).toEqual(['open', 'input:a', 'change:bravo', 'dismiss'])
    await expect(popover).toHaveCount(0)

    // Dynamically removing the committed option leaves no stale listener:
    // navigation skips it and it can never commit.
    await page.getByTestId('st-remove-bravo').click()
    await input.click()
    await expect(popover).toBeVisible()
    await expect(page.getByTestId('st-opt-bravo')).toHaveCount(0)
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, page.getByTestId('st-opt-alpha'))
    await page.keyboard.press('Enter')
    const log = await readLog(page, 'st-log')
    expect(log.slice(4)).toEqual(['open', 'change:alpha', 'dismiss'])
    expect(log.filter(entry => entry === 'change:bravo')).toHaveLength(1)
  })
});
