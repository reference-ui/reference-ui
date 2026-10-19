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
  test('CB-SELECT-03 trigger typeahead: opens closed, cycles enabled matches, commits nothing', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SelectOnlyStory')

    const trigger = page.getByTestId('select-trigger')
    await trigger.focus()
    // Closed typeahead requests one open; nothing is mounted to match yet.
    await page.keyboard.press('a')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(await readLog(page, 'select-log')).toEqual(['open'])

    // Wait for content mount before typeahead matching.
    await expect(page.getByTestId('select-opt-alpha')).toBeVisible()
    await page.keyboard.press('a')
    await expectActiveDescendant(trigger, page.getByTestId('select-opt-alpha'))
    await page.keyboard.press('a')
    await expectActiveDescendant(trigger, page.getByTestId('select-opt-alpha'))
    expect(await focusedTestId(page)).toBe('select-trigger')
    expect(await readLog(page, 'select-log')).toEqual(['open'])

    // After the buffer timeout the cycle restarts from the first match.
    await page.waitForTimeout(650)
    await page.keyboard.press('b')
    await expectActiveDescendant(trigger, page.getByTestId('select-opt-bravo'))
    expect(await readLog(page, 'select-log')).toEqual(['open'])
  })
});
