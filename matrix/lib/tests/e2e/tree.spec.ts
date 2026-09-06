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

  test('TR-KEY-01: Roving focus, vertical navigation, Home/End, and Enter selection', async ({
    page,
  }) => {
    const folder = page.getByTestId('tree-item-folder-1')
    const doc1 = page.getByTestId('tree-item-doc-1')
    const doc2 = page.getByTestId('tree-item-doc-2')
    const readme = page.getByTestId('tree-item-readme')
    const display = page.getByTestId('tree-value-display')

    // Initial roving tabIndex: doc1 is selected, so it has tabIndex=0, folder and others have -1
    await expect(doc1).toHaveAttribute('tabindex', '0')
    await expect(folder).toHaveAttribute('tabindex', '-1')
    await expect(readme).toHaveAttribute('tabindex', '-1')

    // Click folder label -> receives focus, updates tabIndex
    await page.getByText('📁 Documents').click()
    await expect(folder).toBeFocused()
    await expect(folder).toHaveAttribute('tabindex', '0')
    await expect(doc1).toHaveAttribute('tabindex', '-1')

    // ArrowDown -> moves focus to doc1
    await page.keyboard.press('ArrowDown')
    await expect(doc1).toBeFocused()
    await expect(doc1).toHaveAttribute('tabindex', '0')

    // ArrowDown -> moves focus to doc2
    await page.keyboard.press('ArrowDown')
    await expect(doc2).toBeFocused()

    // ArrowDown -> moves focus to readme
    await page.keyboard.press('ArrowDown')
    await expect(readme).toBeFocused()

    // ArrowUp -> back to doc2
    await page.keyboard.press('ArrowUp')
    await expect(doc2).toBeFocused()

    // Press Enter to select doc-2
    await page.keyboard.press('Enter')
    await expect(doc2).toHaveAttribute('aria-selected', 'true')
    await expect(display).toHaveText('Selected: doc-2')

    // Home -> moves focus to first item (folder-1)
    await page.keyboard.press('Home')
    await expect(folder).toBeFocused()

    // End -> moves focus to last visible item (readme)
    await page.keyboard.press('End')
    await expect(readme).toBeFocused()
  })

  test('TR-KEY-02: Horizontal arrow keys handle expand, collapse, and parent traversal', async ({
    page,
  }) => {
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

    // ArrowRight on closed branch -> expands branch, focus stays on branch
    await page.keyboard.press('ArrowRight')
    await expect(folder).toHaveAttribute('aria-expanded', 'true')
    await expect(folder).toBeFocused()
    await expect(doc1).toBeVisible()

    // ArrowRight on already open branch -> moves focus to first child
    await page.keyboard.press('ArrowRight')
    await expect(doc1).toBeFocused()

    // ArrowLeft on child item -> moves focus up to parent branch
    await page.keyboard.press('ArrowLeft')
    await expect(folder).toBeFocused()
  })
})
