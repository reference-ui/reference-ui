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
  test('TR-COMP-03: Tree should compose with Combobox through one virtual-focus and commit authority', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/ComboboxTree')
    const input = page.getByTestId('cb-input')
    await expect(input).toHaveAttribute('aria-haspopup', 'tree')
    await input.click()
    const popover = page.getByTestId('cb-popover')
    await expect(popover).toBeVisible()
    await expect(page.getByTestId('cb-layers')).toHaveText('1')

    // Navigate the three-level tree with DOM focus on the input.
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await cbExpectActiveItem(input, page.getByTestId('cb-item-lib'))
    await expect(input).toBeFocused()

    // Expand the nested branch: exactly one Tree expansion request.
    await page.keyboard.press('ArrowRight')
    await cbExpectLogSoon(page, 'cb-log', ['open', 'expanded:src+src/lib'])
    await expect(page.getByTestId('cb-item-deep')).toBeVisible()
    await cbExpectActiveItem(input, page.getByTestId('cb-item-lib'))

    // Redundant expand enters the revealed third level without emitting.
    await page.keyboard.press('ArrowRight')
    await cbExpectActiveItem(input, page.getByTestId('cb-item-deep'))
    await page.waitForTimeout(150)
    expect(await cbReadLog(page, 'cb-log')).toEqual(['open', 'expanded:src+src/lib'])

    // Dynamic reorder mid-session keeps navigation on the latest hierarchy.
    await cbClickNoFocus(page, 'cb-reorder')
    await page.keyboard.press('ArrowDown')
    await cbExpectActiveItem(input, page.getByTestId('cb-item-readme'))
    await expect(input).toBeFocused()

    // Commit the visible leaf: one scalar root commit, no nested callback.
    await page.keyboard.press('ArrowUp')
    await cbExpectActiveItem(input, page.getByTestId('cb-item-deep'))
    await page.keyboard.press('Enter')
    const log = await cbReadLog(page, 'cb-log')
    expect(log.filter((entry) => entry.startsWith('change:'))).toEqual(['change:src/lib/deep'])
    expect(log.filter((entry) => entry.startsWith('tree:'))).toEqual([])
    expect(log.filter((entry) => entry === 'dismiss')).toHaveLength(1)
    await expect(popover).toHaveCount(0)
    await expect(page.getByTestId('cb-layers')).toHaveText('0')
    await expect(input).toBeFocused()
  })
});
