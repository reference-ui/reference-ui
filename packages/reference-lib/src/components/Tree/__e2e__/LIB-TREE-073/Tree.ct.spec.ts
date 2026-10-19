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

// Programmatic click: drives story controls without moving DOM focus, so an
// open Combobox popover is neither blurred nor outside-dismissed.
async function cbClickNoFocus(page: Page, testid: string) {
  await page.getByTestId(testid).evaluate((el: HTMLElement) => el.click())
}

test.describe('Tree Dynamic Hierarchy Proofs (TR-DYNAMIC-01/02)', () => {
  test('TR-DYNAMIC-01 traversal: depth-first traversal tracks structural edits with first/last boundaries', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/DynamicHierarchy')
    const item = (value: string) => page.getByTestId(`dyn-item-${value}`)

    // Full depth-first walk of the initial tree.
    await item('a').click()
    for (const value of ['a1', 'a2', 'a2i', 'b', 'b1']) {
      await page.keyboard.press('ArrowDown')
      await expect(item(value)).toBeFocused()
    }
    // Boundary: Down at last stays; Home/End span the visible set.
    await page.keyboard.press('ArrowDown')
    await expect(item('b1')).toBeFocused()
    await page.keyboard.press('Home')
    await expect(item('a')).toBeFocused()
    await page.keyboard.press('End')
    await expect(item('b1')).toBeFocused()

    // Insert plus reorder reshape traversal immediately.
    await cbClickNoFocus(page, 'dyn-add-root-leaf')
    await page.keyboard.press('End')
    await expect(item('c')).toBeFocused()
    await cbClickNoFocus(page, 'dyn-reorder-roots')
    await page.keyboard.press('Home')
    await expect(item('c')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(item('b')).toBeFocused()

    // Empty tree: role without items; reset restores traversal.
    await cbClickNoFocus(page, 'dyn-clear')
    await expect(page.getByTestId('dyn-tree')).toHaveAttribute('role', 'tree')
    await expect(page.getByTestId('dyn-tree').getByRole('treeitem')).toHaveCount(0)
    await cbClickNoFocus(page, 'dyn-reset')
    await item('a').click()
    await page.keyboard.press('End')
    await expect(item('b1')).toBeFocused()

    // Single branch: first/last span the two nodes.
    await cbClickNoFocus(page, 'dyn-single')
    await expect(item('s')).toHaveAttribute('aria-expanded', 'false')
    await page.getByTestId('dyn-expander-s').click()
    await expect(item('s1')).toBeVisible()
    await item('s').click()
    await page.keyboard.press('End')
    await expect(item('s1')).toBeFocused()
    await page.keyboard.press('Home')
    await expect(item('s')).toBeFocused()
  })
});
