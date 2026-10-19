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
  test('TR-DYNAMIC-01: hierarchy metadata recomputes after structural edits at every level', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/DynamicHierarchy')
    const item = (value: string) => page.getByTestId(`dyn-item-${value}`)

    // Initial metadata: levels, positions, set sizes.
    await expect(item('a')).toHaveAttribute('aria-level', '1')
    await expect(item('a')).toHaveAttribute('aria-posinset', '1')
    await expect(item('a')).toHaveAttribute('aria-setsize', '2')
    await expect(item('a1')).toHaveAttribute('aria-level', '2')
    await expect(item('a2i')).toHaveAttribute('aria-level', '3')

    // Insert a root leaf: root sibling metadata updates.
    await cbClickNoFocus(page, 'dyn-add-root-leaf')
    await expect(item('c')).toBeVisible()
    await expect(item('c')).toHaveAttribute('aria-level', '1')
    await expect(item('c')).toHaveAttribute('aria-posinset', '3')
    await expect(item('b')).toHaveAttribute('aria-setsize', '3')

    // Insert a nested leaf: nested positions update.
    await cbClickNoFocus(page, 'dyn-add-nested-leaf')
    await expect(item('a3')).toHaveAttribute('aria-level', '2')
    await expect(item('a3')).toHaveAttribute('aria-posinset', '3')
    await expect(item('a1')).toHaveAttribute('aria-setsize', '3')

    // Insert a root branch and expand it: the new subtree joins.
    await cbClickNoFocus(page, 'dyn-add-root-branch')
    await expect(item('d')).toHaveAttribute('aria-expanded', 'false')
    await expect(item('d1')).toHaveCount(0)
    await page.getByTestId('dyn-expander-d').click()
    await expect(item('d1')).toBeVisible()
    await expect(item('d1')).toHaveAttribute('aria-level', '2')

    // Reorder roots: positions follow the new order.
    await cbClickNoFocus(page, 'dyn-reorder-roots')
    await expect(item('a')).toHaveAttribute('aria-posinset', '4')
    await expect(item('d')).toHaveAttribute('aria-posinset', '1')

    // Reorder nested: nested positions follow.
    await cbClickNoFocus(page, 'dyn-reorder-nested')
    await expect(item('a1')).toHaveAttribute('aria-posinset', '3')
    await expect(item('a3')).toHaveAttribute('aria-posinset', '1')

    // Remove a focused leaf: focus recovers, metadata contracts.
    await item('a1').click()
    await expect(item('a1')).toBeFocused()
    await cbClickNoFocus(page, 'dyn-remove-leaf')
    await expect(item('a1')).toHaveCount(0)
    await expect(item('a2i')).toBeFocused()
    await expect(item('a2')).toHaveAttribute('aria-setsize', '2')

    // Remove a branch: the whole subtree leaves.
    await cbClickNoFocus(page, 'dyn-remove-branch')
    await expect(item('d')).toHaveCount(0)
    await expect(item('d1')).toHaveCount(0)
  })
});
