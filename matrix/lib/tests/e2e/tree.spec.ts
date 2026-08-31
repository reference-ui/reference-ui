import { expect, test } from '@playwright/test'

test.describe('Tree Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tree')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()
  })

  test('TR-DOM-01: Renders tree, expands/collapses branch and selects items', async ({
    page,
  }) => {
    const tree = page.getByTestId('test-tree')
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

    // Click doc-2 -> selects doc-2
    await doc2.click()
    await expect(doc2).toHaveAttribute('aria-selected', 'true')
    await expect(doc1).toHaveAttribute('aria-selected', 'false')
    await expect(display).toHaveText('Selected: doc-2')

    // Click expander -> collapses folder-1
    await expander.click()
    await expect(folder).toHaveAttribute('aria-expanded', 'false')
    await expect(doc1).toHaveCount(0)
  })
})
