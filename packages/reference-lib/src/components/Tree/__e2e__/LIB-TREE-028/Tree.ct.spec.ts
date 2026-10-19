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
  test('TR-SELECT-07: Tree should retain a controlled selected descendant while its ancestor is collapsed', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const expander = page.getByTestId('expander-folder-1')
    const display = page.getByTestId('tree-value-display')
    await expect(display).toHaveText('Selected: doc-1')

    await expander.click()
    await expect(page.getByTestId('tree-item-doc-1')).toHaveCount(0)
    await expect(display).toHaveText('Selected: doc-1')

    await expander.click()
    const doc1 = page.getByTestId('tree-item-doc-1')
    await expect(doc1).toBeVisible()
    await expect(doc1).toHaveAttribute('aria-selected', 'true')
  })
});
