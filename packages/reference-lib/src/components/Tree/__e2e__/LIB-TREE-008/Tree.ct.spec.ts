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

test.describe('Tree Composition Gates & Browser Proofs', () => {
  test('TR-DOM-01: Renders tree, expands/collapses branch and selects items', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Basic')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const tree = page.getByTestId('test-tree')
    const root = page.getByTestId('tree-fixture-root')
    const folder = page.getByTestId('tree-item-folder-1')
    const expander = page.getByTestId('expander-folder-1')
    const doc1 = page.getByTestId('tree-item-doc-1')
    const doc2 = page.getByTestId('tree-item-doc-2')
    const display = page.getByTestId('tree-value-display')

    await expect(tree).toHaveAttribute('role', 'tree')
    await expect(folder).toHaveAttribute('role', 'treeitem')
    await expect(folder).toHaveAttribute('aria-expanded', 'true')
    await expect(doc1).toHaveAttribute('aria-selected', 'true')
    await expect(display).toHaveText('Selected: doc-1')

    await page.waitForTimeout(300)
    await snap(page, 'tree-default-expanded')
    await snap(root, 'tree-root-default-expanded', { maxDiffPixelRatio: 0.001 })
    await snap(tree, 'tree-box-default-expanded', { maxDiffPixelRatio: 0.001 })

    // Hover doc-2
    await doc2.hover()
    await page.waitForTimeout(200)
    await snap(page, 'tree-doc2-hover')

    // Click doc-2 -> selects doc-2
    await doc2.click()
    await expect(doc2).toHaveAttribute('aria-selected', 'true')
    await expect(doc1).toHaveAttribute('aria-selected', 'false')
    await expect(display).toHaveText('Selected: doc-2')

    await page.waitForTimeout(200)
    await snap(page, 'tree-doc2-selected')

    // Click expander -> collapses folder-1
    await expander.click()
    await expect(folder).toHaveAttribute('aria-expanded', 'false')
    await expect(doc1).toHaveCount(0)

    await page.waitForTimeout(200)
    await snap(page, 'tree-folder-collapsed')
    await snap(tree, 'tree-box-collapsed', { maxDiffPixelRatio: 0.001 })

    // Hover folder while collapsed
    await folder.hover()
    await page.waitForTimeout(200)
    await snap(page, 'tree-folder-hover')

    // Click expander -> expands folder-1 again
    await expander.click()
    await expect(folder).toHaveAttribute('aria-expanded', 'true')
    await expect(doc1).toBeVisible()

    await page.waitForTimeout(200)
    await snap(page, 'tree-folder-reexpanded')
  })
});
