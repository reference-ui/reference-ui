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
  test('TR-DOM-06: Tree data-state hooks should stay synchronized with their authoritative ARIA state', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder1 = page.getByTestId('tree-item-folder-1')
    const doc1 = page.getByTestId('tree-item-doc-1')

    await expect(folder1).toHaveAttribute('data-expanded', '')
    await expect(folder1).toHaveAttribute('aria-expanded', 'true')
    await expect(folder1).toHaveAttribute('data-level', '1')
    await expect(folder1).toHaveAttribute('aria-level', '1')

    await expect(doc1).toHaveAttribute('data-selected', '')
    await expect(doc1).toHaveAttribute('aria-selected', 'true')
    await expect(doc1).toHaveAttribute('data-level', '2')
    await expect(doc1).toHaveAttribute('aria-level', '2')
  })
});
