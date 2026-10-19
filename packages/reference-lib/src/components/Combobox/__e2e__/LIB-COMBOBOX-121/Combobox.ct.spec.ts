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

async function focusedTestId(page: Page) {
  return page.evaluate(
    () => (document.activeElement as HTMLElement | null)?.getAttribute('data-testid')
  )
}

async function expectActiveDescendant(source: Locator, option: Locator) {
  const id = await option.getAttribute('id')
  expect(id).toBeTruthy()
  await expect(source).toHaveAttribute('aria-activedescendant', id!)
}

test.describe('Combobox reconciliation CT', () => {
  test('CB-COMMIT-04 source gate: immediate tab on selection-active commits nothing', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/Combobox/Combobox/SelectedLog')

    const input = page.getByTestId('log-input')
    await input.click()
    const bravo = page.getByTestId('log-opt-bravo')
    await expectActiveDescendant(input, bravo)

    // Initial-on-open active carries no source, so Tab cannot commit it.
    await page.keyboard.press('Tab')
    const log = await readLog(page, 'log-counts')
    expect(log.filter(e => e.startsWith('change:'))).toEqual([])
    expect(log.filter(e => e === 'dismiss').length).toBe(1)
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    if (browserName === 'webkit') {
      // same button-skip landing as CB-COMMIT-07 above.
      expect(await focusedTestId(page)).toBeNull()
    } else {
      await expect(page.getByTestId('log-clear')).toBeFocused()
    }
  })
});
