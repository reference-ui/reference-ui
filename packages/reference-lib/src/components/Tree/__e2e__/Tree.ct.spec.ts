import { test, expect, snap } from '../../../../playwright/ct'

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

  test('TR-KEY-01: Roving focus, vertical navigation, Home/End, and Enter selection', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Basic')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder = page.getByTestId('tree-item-folder-1')
    const doc1 = page.getByTestId('tree-item-doc-1')
    const doc2 = page.getByTestId('tree-item-doc-2')
    const readme = page.getByTestId('tree-item-readme')
    const display = page.getByTestId('tree-value-display')

    // Focus folder
    await folder.focus()
    await expect(folder).toBeFocused()

    // ArrowDown roving navigation
    await page.keyboard.press('ArrowDown')
    await expect(doc1).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect(doc2).toBeFocused()

    // Press Enter to select focused item
    await page.keyboard.press('Enter')
    await expect(doc2).toHaveAttribute('aria-selected', 'true')
    await expect(display).toHaveText('Selected: doc-2')

    // Home moves focus to first item
    await page.keyboard.press('Home')
    await expect(folder).toBeFocused()

    // End moves focus to last visible item
    await page.keyboard.press('End')
    await expect(readme).toBeFocused()
  })

  test('TR-KEY-02: Horizontal arrow keys handle expand, collapse, and parent traversal', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Basic')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder = page.getByTestId('tree-item-folder-1')
    const doc1 = page.getByTestId('tree-item-doc-1')

    // Focus folder-1 (currently expanded)
    await folder.focus()
    await expect(folder).toBeFocused()
    await expect(folder).toHaveAttribute('aria-expanded', 'true')

    // ArrowLeft on open branch -> collapses branch, focus stays on branch
    await page.keyboard.press('ArrowLeft')
    await expect(folder).toHaveAttribute('aria-expanded', 'false')
    await expect(folder).toBeFocused()
    await expect(doc1).toHaveCount(0)

    await page.waitForTimeout(200)
    await snap(page, 'tree-arrowleft-collapsed')

    // ArrowRight on closed branch -> expands branch, focus stays on branch
    await page.keyboard.press('ArrowRight')
    await expect(folder).toHaveAttribute('aria-expanded', 'true')
    await expect(folder).toBeFocused()
    await expect(doc1).toBeVisible()

    // ArrowRight on already open branch -> moves focus to first child
    await page.keyboard.press('ArrowRight')
    await expect(doc1).toBeFocused()

    await page.waitForTimeout(200)
    await snap(page, 'tree-arrowright-child-focused')

    // ArrowLeft on child item -> moves focus up to parent branch
    await page.keyboard.press('ArrowLeft')
    await expect(folder).toBeFocused()
  })

  test('TR-DOM-02: Multi-level hierarchy rendering', async ({ mount, page }) => {
    await mount('components/Tree/Tree/MultiLevel')
    const multiRoot = page.getByTestId('tree-multi-root')
    await expect(multiRoot).toBeVisible()

    await page.waitForTimeout(300)
    await snap(page, 'tree-multilevel')
    await snap(multiRoot, 'tree-multi-root-default', { maxDiffPixelRatio: 0.001 })
  })
})
