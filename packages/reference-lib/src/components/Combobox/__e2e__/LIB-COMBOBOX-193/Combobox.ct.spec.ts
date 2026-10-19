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

test.describe('Combobox virtual listbox and tree bridge CT', () => {
  test('CB-SELECT-05 shift-tab: select-only backward traversal commits text-free', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/Combobox/Combobox/SelectOnlyTabOrder')

    const trigger = page.getByTestId('sel-tab-trigger')
    const popover = page.getByTestId('sel-tab-popover')
    await trigger.click()
    if (browserName === 'webkit') {
      // click leaves focus on body
      // (proven: ArrowDown no-op, active stuck at alpha).
      await trigger.focus()
    }
    await expect(popover).toBeVisible()
    await expectActiveDescendant(trigger, page.getByTestId('sel-tab-opt-alpha'))
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(trigger, page.getByTestId('sel-tab-opt-bravo'))

    // Shift+Tab commits with zero text callbacks and lands behind.
    await page.keyboard.press('Shift+Tab')
    await expect(popover).toHaveCount(0)
    const log = await readLog(page, 'sel-tab-log')
    expect(log).toContain('change:bravo')
    expect(log.some(entry => entry.startsWith('input:'))).toBe(false)
    if (browserName === 'webkit') {
      // Commit + dismiss proven above; backward traversal skips the
      // Shift+Tab past the button lands on body.
      expect(await focusedTestId(page)).toBeNull()
    } else {
      expect(await focusedTestId(page)).toBe('sel-tab-before')
    }
  })
});
