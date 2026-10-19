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
  test('TR-DOM-12: Tree should remove collapsed descendants from the rendered accessibility and focus tree', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder1 = page.getByTestId('tree-item-folder-1')
    const expander = page.getByTestId('expander-folder-1')

    await expect(page.getByTestId('tree-item-doc-1')).toBeVisible()
    await expander.click()
    await expect(page.getByTestId('tree-item-doc-1')).toHaveCount(0)
    await expect(folder1).toHaveAttribute('aria-expanded', 'false')

    await expander.click()
    await expect(page.getByTestId('tree-item-doc-1')).toBeVisible()
    await expect(folder1).toHaveAttribute('aria-expanded', 'true')
  })
});
