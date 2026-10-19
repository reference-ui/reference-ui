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

test.describe('Tree parity', () => {
  test("TR-DOM-05: Tree should report each item's position within its actual sibling set", async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const item1 = page.getByTestId('reorder-item-1')
    const item2 = page.getByTestId('reorder-item-2')
    const item3 = page.getByTestId('reorder-item-3')

    await expect(item1).toHaveAttribute('aria-posinset', '1')
    await expect(item1).toHaveAttribute('aria-setsize', '3')
    await expect(item2).toHaveAttribute('aria-posinset', '2')
    await expect(item2).toHaveAttribute('aria-setsize', '3')
    await expect(item3).toHaveAttribute('aria-posinset', '3')
    await expect(item3).toHaveAttribute('aria-setsize', '3')
  })
});
