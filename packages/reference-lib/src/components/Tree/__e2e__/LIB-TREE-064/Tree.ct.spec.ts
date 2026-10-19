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

test.describe('Tree Combobox Bridge (TR-CB / TR-COMP-03)', () => {
  test('TR-CB-01: Tree should provide visible-only virtual navigation inside an editable Combobox', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/ComboboxTree')
    const input = page.getByTestId('cb-input')
    await input.click()
    const popover = page.getByTestId('cb-popover')
    await expect(popover).toBeVisible()

    // Nested items keep no tab stop: the input owns DOM focus.
    await expect(popover.getByRole('treeitem')).toHaveCount(6)
    for (const testid of [
      'cb-item-src',
      'cb-item-index',
      'cb-item-lib',
      'cb-item-docs',
      'cb-item-readme',
      'cb-item-disabled',
    ]) {
      await expect(page.getByTestId(testid)).toHaveAttribute('tabindex', '-1')
    }

    // Vertical arrows visit mounted enabled visible treeitems only, wrapping.
    const order = [
      'cb-item-src',
      'cb-item-index',
      'cb-item-lib',
      'cb-item-docs',
      'cb-item-readme',
      'cb-item-src',
    ]
    for (const testid of order) {
      await page.keyboard.press('ArrowDown')
      await cbExpectActiveItem(input, page.getByTestId(testid))
      await expect(input).toBeFocused()
    }
    await page.keyboard.press('ArrowUp')
    await cbExpectActiveItem(input, page.getByTestId('cb-item-readme'))
    await expect(input).toBeFocused()

    // Collapsed descendants stay unmounted and are never referenced.
    await expect(page.getByTestId('cb-item-guide')).toHaveCount(0)
    await expect(page.getByTestId('cb-item-deep')).toHaveCount(0)
    expect(await cbReadLog(page, 'cb-log')).toEqual(['open'])

    // Pointer press on a disabled item never moves DOM focus or commits.
    await page.getByTestId('cb-item-disabled').click({ force: true })
    await expect(input).toBeFocused()
    await expect(popover).toBeVisible()
    expect(await cbReadLog(page, 'cb-log')).toEqual(['open'])
  })
});
