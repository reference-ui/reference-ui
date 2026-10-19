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
  test('TR-DYNAMIC-02: hierarchy preserves value identity when moving a branch with descendants', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/DynamicHierarchy')
    const item = (value: string) => page.getByTestId(`dyn-item-${value}`)
    const focusItem = async (value: string) => {
      await item(value).evaluate((el: HTMLElement) => el.focus())
      await expect(item(value)).toBeFocused()
    }

    // Pin selection on the moving subtree before any move.
    await item('a2i').click()
    await expect(item('a2i')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('dyn-value')).toHaveText('Selected: a2i')

    // Move within the parent: A travels to the root end, descendants intact.
    await cbClickNoFocus(page, 'dyn-move-within')
    await expect(item('a')).toHaveAttribute('aria-level', '1')
    await expect(item('a')).toHaveAttribute('aria-posinset', '2')
    await expect(item('a2i')).toHaveAttribute('aria-level', '3')
    await expect(item('a2i')).toHaveAttribute('aria-selected', 'true')
    await expect(item('a')).toHaveAttribute('aria-expanded', 'true')
    await expect(item('a2')).toHaveAttribute('aria-expanded', 'true')
    await focusItem('b')
    for (const value of ['b1', 'a', 'a1', 'a2', 'a2i']) {
      await page.keyboard.press('ArrowDown')
      await expect(item(value)).toBeFocused()
    }

    // Move to another parent: levels shift, identity holds, no callbacks.
    await cbClickNoFocus(page, 'dyn-move-under-b')
    await expect(item('a')).toHaveAttribute('aria-level', '2')
    await expect(item('a1')).toHaveAttribute('aria-level', '3')
    await expect(item('a2i')).toHaveAttribute('aria-level', '4')
    await expect(item('a')).toHaveAttribute('aria-posinset', '2')
    await expect(item('a')).toHaveAttribute('aria-setsize', '2')
    await expect(item('a2i')).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByTestId('dyn-value')).toHaveText('Selected: a2i')
    await expect(item('a')).toHaveAttribute('aria-expanded', 'true')
    await focusItem('b')
    for (const value of ['b1', 'a', 'a1', 'a2', 'a2i']) {
      await page.keyboard.press('ArrowDown')
      await expect(item(value)).toBeFocused()
    }
    await page.keyboard.press('End')
    await expect(item('a2i')).toBeFocused()

    // Only the user's own selection exists — moves emit nothing corrective.
    await expect(page.getByTestId('dyn-selection-log')).toHaveText('SelectionLog: a2i')
    await expect(page.getByTestId('dyn-expansion-log')).toHaveText('ExpansionLog:')
  })
});
