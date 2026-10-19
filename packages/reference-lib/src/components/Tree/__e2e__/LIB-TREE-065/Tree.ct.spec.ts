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

async function cbExpectLogSoon(page: Page, testid: string, expected: string[]) {
  await expect.poll(async () => cbReadLog(page, testid)).toEqual(expected)
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
  test('TR-CB-02: Tree should request horizontal expansion under Combobox virtual focus without moving DOM focus', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/ComboboxTree')
    const input = page.getByTestId('cb-input')
    await input.click()
    await expect(page.getByTestId('cb-popover')).toBeVisible()

    // Setup: collapse src through the delegated collapse key, then clear the
    // log so the pinned flow starts collapsed with a clean slate.
    await page.keyboard.press('ArrowDown')
    await cbExpectActiveItem(input, page.getByTestId('cb-item-src'))
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('cb-item-src')).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('cb-item-index')).toHaveCount(0)
    await cbExpectActiveItem(input, page.getByTestId('cb-item-src'))
    await cbClickNoFocus(page, 'cb-clear-log')
    expect(await cbReadLog(page, 'cb-log')).toEqual([])

    // Expand key on collapsed src: one request, active retained on src.
    await page.keyboard.press('ArrowRight')
    await cbExpectLogSoon(page, 'cb-log', ['expanded:src'])
    await expect(page.getByTestId('cb-item-src')).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('cb-item-index')).toBeVisible()
    await cbExpectActiveItem(input, page.getByTestId('cb-item-src'))
    await expect(input).toBeFocused()

    // Press again: no second request — virtual enter moves to first child.
    await page.keyboard.press('ArrowRight')
    await cbExpectActiveItem(input, page.getByTestId('cb-item-index'))
    await page.waitForTimeout(150)
    expect(await cbReadLog(page, 'cb-log')).toEqual(['expanded:src'])
    await expect(input).toBeFocused()

    // Redundant collapse on a nested collapsed branch moves to the parent
    // (TR-KEY-05 parity), still without emissions or commits.
    await page.keyboard.press('ArrowDown')
    await cbExpectActiveItem(input, page.getByTestId('cb-item-lib'))
    await page.keyboard.press('ArrowLeft')
    await cbExpectActiveItem(input, page.getByTestId('cb-item-src'))
    await page.waitForTimeout(150)
    const log = await cbReadLog(page, 'cb-log')
    expect(log).toEqual(['expanded:src'])
    expect(log.filter((entry) => entry.startsWith('change:'))).toEqual([])
    await expect(input).toBeFocused()
  })
});
