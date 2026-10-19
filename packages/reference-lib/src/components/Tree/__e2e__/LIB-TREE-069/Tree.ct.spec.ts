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
  test('TR-CB-05: Tree should refresh the automatic Combobox registry when expansion or dynamic hierarchy changes visibility', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/ComboboxTree')
    const input = page.getByTestId('cb-input')
    await input.click()
    await expect(page.getByTestId('cb-popover')).toBeVisible()

    // An active child disappears by controlled collapse; the descendant follows.
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await cbExpectActiveItem(input, page.getByTestId('cb-item-index'))
    await cbClickNoFocus(page, 'cb-collapse-src')
    await expect(page.getByTestId('cb-item-index')).toHaveCount(0)
    await cbExpectActiveItem(input, page.getByTestId('cb-item-docs'))
    await expect(input).toBeFocused()

    // Reorder: reversed roots navigate in the new order.
    await cbClickNoFocus(page, 'cb-reorder')
    await page.keyboard.press('ArrowDown')
    await cbExpectActiveItem(input, page.getByTestId('cb-item-src'))
    await page.keyboard.press('ArrowUp')
    await cbExpectActiveItem(input, page.getByTestId('cb-item-docs'))
    await page.keyboard.press('ArrowUp')
    await cbExpectActiveItem(input, page.getByTestId('cb-item-readme'))
    await expect(input).toBeFocused()

    // Replace a hidden value, re-expand, and prove the stale value is gone.
    await cbClickNoFocus(page, 'cb-rename')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await cbExpectActiveItem(input, page.getByTestId('cb-item-src'))
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('cb-item-index')).toBeVisible()
    await cbExpectActiveItem(input, page.getByTestId('cb-item-src'))
    // Let passive registration effects catch up to the painted DOM: the
    // ArrowDown presses below read the registry synchronously.
    await page.waitForTimeout(200)
    const seen: string[] = []
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowDown')
      seen.push((await input.getAttribute('aria-activedescendant')) ?? '')
    }
    expect(seen).not.toContain('src/index')
    expect(seen).toContain('src/main')

    // Remove the active branch: active follows to a mounted item, and Enter
    // commits the current value — never the stale branch.
    await cbClickNoFocus(page, 'cb-toggle-src')
    await expect(page.getByTestId('cb-item-src')).toHaveCount(0)
    await expect(page.getByTestId('cb-item-index')).toHaveCount(0)
    await cbExpectActiveItem(input, page.getByTestId('cb-item-docs'))
    await expect(input).toBeFocused()
    await page.keyboard.press('Enter')
    const log = await cbReadLog(page, 'cb-log')
    expect(log.filter((entry) => entry.startsWith('change:'))).toEqual(['change:docs'])

    // A newly mounted descendant expands into the navigable set.
    await input.click()
    await expect(page.getByTestId('cb-popover')).toBeVisible()
    await cbClickNoFocus(page, 'cb-add-child')
    await expect(page.getByTestId('cb-item-new')).toHaveCount(0)
    await cbExpectActiveItem(input, page.getByTestId('cb-item-docs'))
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('cb-item-new')).toBeVisible()
    // Let passive registration effects catch up before navigating.
    await page.waitForTimeout(200)
    await page.keyboard.press('ArrowDown')
    await cbExpectActiveItem(input, page.getByTestId('cb-item-guide'))
    await page.keyboard.press('ArrowDown')
    await cbExpectActiveItem(input, page.getByTestId('cb-item-new'))
    await expect(input).toBeFocused()
  })
});
