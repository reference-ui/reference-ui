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
  test('LB-CB-01: virtual focus without tab stops; activedescendant tracks; one scalar commit', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ControlledLog')

    const input = page.getByTestId('log-input')
    await input.click()

    const tabIndexes = await page
      .getByTestId('log-popover')
      .locator('[role="option"]')
      .evaluateAll(els => els.map(el => (el as HTMLElement).tabIndex))
    expect(tabIndexes.length).toBe(4)
    expect(tabIndexes.every(t => t === -1)).toBe(true)

    await page.keyboard.press('ArrowDown')
    const alpha = page.getByTestId('log-opt-alpha')
    const activeId = await input.getAttribute('aria-activedescendant')
    expect(activeId).toBe(await alpha.getAttribute('id'))
    expect(
      await page.evaluate(id => !!document.getElementById(id!), activeId)
    ).toBe(true)

    await page.keyboard.press('Enter')
    const log = await readLog(page, 'log-counts')
    expect(log.filter(e => e.startsWith('change:'))).toEqual(['change:alpha'])
  })
});
