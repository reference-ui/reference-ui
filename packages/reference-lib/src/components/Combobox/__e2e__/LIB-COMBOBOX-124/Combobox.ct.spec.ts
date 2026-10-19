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
  test('CB-SELECT-02 trigger arrows: open keeps trigger focus with selection pending', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SelectOnlyStory')

    const trigger = page.getByTestId('select-trigger')
    await trigger.focus()
    await page.keyboard.press('ArrowDown')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expectActiveDescendant(trigger, page.getByTestId('select-opt-bravo'))
    expect(await focusedTestId(page)).toBe('select-trigger')
    expect(await readLog(page, 'select-log')).toEqual(['open'])

    // Open arrows wrap through enabled options, skipping disabled delta.
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(trigger, page.getByTestId('select-opt-charlie'))
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(trigger, page.getByTestId('select-opt-alpha'))
    await page.keyboard.press('ArrowUp')
    await expectActiveDescendant(trigger, page.getByTestId('select-opt-charlie'))
    expect(await focusedTestId(page)).toBe('select-trigger')
    expect(await readLog(page, 'select-log')).toEqual(['open'])
  })
});
