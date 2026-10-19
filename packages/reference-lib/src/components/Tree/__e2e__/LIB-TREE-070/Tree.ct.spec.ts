/**
 * Tree composition gates and browser proofs. Pins hierarchy rendering,
 * controlled selection and expansion with deterministic emission, APG
 * keyboard traversal with RTL mirroring, typeahead over the visible set,
 * dynamic recovery, Combobox bridge commits and virtual focus, ShadowRoot
 * traversal, and an accessibility-clean sweep.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

async function cbReadLog(page: Page, testid: string): Promise<string[]> {
  return JSON.parse((await page.getByTestId(testid).textContent()) ?? '[]')
}

async function cbExpectActiveItem(source: Locator, item: Locator) {
  const id = await item.getAttribute('id')
  await expect(source).toHaveAttribute('aria-activedescendant', id ?? '')
}

// Programmatic click: drives story controls without moving DOM focus, so an
// open Combobox popover is neither blurred nor outside-dismissed.
async function cbClickNoFocus(page: Page, testid: string) {
  await page.getByTestId(testid).evaluate((el: HTMLElement) => el.click())
}

test.describe('Tree Combobox Bridge (TR-CB / TR-COMP-03)', () => {
  test('TR-CB-06: Tree should publish local active styling state when Combobox virtually focuses one visible mounted Item', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/ComboboxTree')
    await cbClickNoFocus(page, 'cb-select-readme')
    await expect(page.getByTestId('cb-value')).toHaveText('Selected: readme')
    const input = page.getByTestId('cb-input')
    await input.click()
    await expect(page.getByTestId('cb-popover')).toBeVisible()

    // Keyboard virtual focus previews data-active only on the active item
    // while controlled selection stays independently on readme.
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await cbExpectActiveItem(input, page.getByTestId('cb-item-index'))
    const index = page.getByTestId('cb-item-index')
    await expect(index).toHaveAttribute('data-active', '')
    await expect(page.getByTestId('cb-item-readme')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('cb-item-readme')).not.toHaveAttribute('data-active', '')
    await expect(page.getByTestId('cb-item-src')).not.toHaveAttribute('data-active', '')
    await expect(page.locator('[data-testid="cb-tree"] [data-active]')).toHaveCount(1)
    await expect(input).toBeFocused()

    // Pointer preview moves the hook; DOM focus stays on the input.
    await page.getByTestId('cb-item-lib').hover()
    await cbExpectActiveItem(input, page.getByTestId('cb-item-lib'))
    await expect(page.getByTestId('cb-item-lib')).toHaveAttribute('data-active', '')
    await expect(index).not.toHaveAttribute('data-active', '')
    await expect(input).toBeFocused()

    // Collapse clears the hidden child's hook and descendant atomically.
    await cbClickNoFocus(page, 'cb-collapse-src')
    await expect(page.getByTestId('cb-item-lib')).toHaveCount(0)
    await cbExpectActiveItem(input, page.getByTestId('cb-item-readme'))
    await expect(page.getByTestId('cb-item-readme')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('[data-testid="cb-tree"] [data-active]')).toHaveCount(1)

    // Activating a sibling commits once through the root; selection follows.
    await page.keyboard.press('ArrowUp')
    await cbExpectActiveItem(input, page.getByTestId('cb-item-docs'))
    await page.keyboard.press('Enter')
    const log = await cbReadLog(page, 'cb-log')
    expect(log.filter((entry) => entry.startsWith('change:'))).toEqual(['change:docs'])
    await expect(page.getByTestId('cb-popover')).toHaveCount(0)
    await input.click()
    await expect(page.getByTestId('cb-item-docs')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('cb-item-readme')).toHaveAttribute('aria-selected', 'false')
  })
});
