/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

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
  test('CB-COMMIT-04 shift-tab: backward traversal commits and lands behind', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/Combobox/Combobox/TabOrder')

    const input = page.getByTestId('tab-input')
    const popover = page.getByTestId('tab-popover')
    await input.click()
    await expect(popover).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, page.getByTestId('tab-opt-apple'))
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, page.getByTestId('tab-opt-banana'))

    // Shift+Tab commits the keyboard-active option, dismisses, clears
    // the descendant, and traverses natively to the previous stop.
    await page.keyboard.press('Shift+Tab')
    await expect(popover).toHaveCount(0)
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)
    await expect(input).toHaveValue('Banana')
    if (browserName === 'webkit') {
      // commit + dismiss + value proven above; backward
      // traversal skips the Before button to body (probe P-TAB).
      expect(await focusedTestId(page)).toBeNull()
    } else {
      expect(await focusedTestId(page)).toBe('tab-before')
    }
  })
});
