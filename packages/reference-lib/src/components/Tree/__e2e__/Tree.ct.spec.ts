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

    // One roving tab stop, seeded on the selected item
    await expect(doc1).toHaveAttribute('tabindex', '0')
    await expect(folder).toHaveAttribute('tabindex', '-1')
    await expect(readme).toHaveAttribute('tabindex', '-1')

    // Focus folder
    await folder.focus()
    await expect(folder).toBeFocused()
    await expect(folder).toHaveAttribute('tabindex', '0')
    await expect(doc1).toHaveAttribute('tabindex', '-1')

    // ArrowDown roving navigation
    await page.keyboard.press('ArrowDown')
    await expect(doc1).toBeFocused()
    await expect(doc1).toHaveAttribute('tabindex', '0')

    await page.keyboard.press('ArrowDown')
    await expect(doc2).toBeFocused()
    await expect(doc2).toHaveAttribute('tabindex', '0')

    await page.keyboard.press('ArrowUp')
    await expect(doc1).toBeFocused()

    // Press Enter to select focused item
    await doc2.focus()
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

    // One-based levels derive from authored nesting at every depth
    await expect(page.getByTestId('tree-folder-packages')).toHaveAttribute('aria-level', '1')
    await expect(page.getByTestId('tree-folder-components')).toHaveAttribute('aria-level', '2')
    await expect(page.getByTestId('tree-file-switch')).toHaveAttribute('aria-level', '3')
    await expect(page.getByTestId('tree-file-tabs')).toHaveAttribute('aria-level', '3')
    await expect(page.getByTestId('tree-file-pkg')).toHaveAttribute('aria-level', '2')

    await page.waitForTimeout(300)
    await snap(page, 'tree-multilevel')
    await snap(multiRoot, 'tree-multi-root-default', { maxDiffPixelRatio: 0.001 })
  })
})

test.describe('Tree Quarantine Parity', () => {
  test('TR-DOM-03: Tree should expose expansion state only on items that currently own children', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder1 = page.getByTestId('tree-item-folder-1')
    const readme = page.getByTestId('tree-item-readme')
    const alpha = page.getByTestId('tree-item-alpha')

    await expect(folder1).toHaveAttribute('aria-expanded', 'true')
    await expect(readme).not.toHaveAttribute('aria-expanded')
    await expect(alpha).not.toHaveAttribute('aria-expanded')

    await page.getByTestId('toggle-alpha-branch').click()
    await expect(alpha).toHaveAttribute('aria-expanded', 'false')

    await page.getByTestId('toggle-alpha-branch').click()
    await expect(alpha).not.toHaveAttribute('aria-expanded')
  })

  test('TR-DOM-04: Tree items should mirror controlled selection and disabled state independently', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const doc1 = page.getByTestId('tree-item-doc-1')
    const disabledLeaf = page.getByTestId('tree-item-disabled-leaf')

    await expect(doc1).toHaveAttribute('aria-selected', 'true')
    await expect(doc1).not.toHaveAttribute('aria-disabled')

    await expect(disabledLeaf).toHaveAttribute('aria-disabled', 'true')
    await expect(disabledLeaf).toHaveAttribute('data-disabled', '')
    await expect(disabledLeaf).toHaveAttribute('aria-selected', 'false')

    await page.getByTestId('set-value-charlie').click()
    const charlie = page.getByTestId('tree-item-charlie')
    await expect(charlie).toHaveAttribute('aria-selected', 'true')
    await expect(doc1).toHaveAttribute('aria-selected', 'false')
    await expect(disabledLeaf).toHaveAttribute('aria-disabled', 'true')
    await expect(disabledLeaf).toHaveAttribute('aria-selected', 'false')
  })

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

  test('TR-DOM-07: Tree parts should preserve all fixed native element contracts without polymorphic hosts', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const tree = page.getByTestId('test-tree')
    const folder1 = page.getByTestId('tree-item-folder-1')
    const expander = page.getByTestId('expander-folder-1')

    await expect(tree).toHaveJSProperty('tagName', 'DIV')
    await expect(folder1).toHaveJSProperty('tagName', 'DIV')
    await expect(expander).toHaveJSProperty('tagName', 'BUTTON')
    await expect(expander).toHaveAttribute('type', 'button')

    // Object and callback refs reach the native hosts
    await expect(page.getByTestId('refs-tags-display')).toHaveText('Tags: DIV,DIV,DIV,BUTTON')
  })

  test('TR-DOM-08: Tree should reject duplicate item values while preserving path-like and zero-like strings as opaque identities', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    // Zero-like identity selects without truthiness coercion
    await page.getByTestId('tree-item-zero').click()
    await expect(page.getByTestId('tree-value-display')).toHaveText('Selected: 0')

    // Digit-leading labels search by their digits, not stripped decoration
    await page.getByTestId('tree-item-folder-1').focus()
    await page.keyboard.type('0')
    await expect(page.getByTestId('tree-item-zero')).toBeFocused()

    // Path-like branch identity expands without path parsing
    await page.getByTestId('expander-path').click()
    await expect(page.getByTestId('tree-item-path-child')).toBeVisible()
    await expect(page.getByTestId('tree-item-path-branch')).toHaveAttribute('aria-expanded', 'true')

    // A duplicate identity throws a descriptive error instead of going ambiguous
    const [pageError] = await Promise.all([
      page.waitForEvent('pageerror'),
      page.getByTestId('toggle-duplicate').click(),
    ])
    expect(pageError.message).toContain('Duplicate')
  })

  test('TR-DOM-09: Empty Tree should expose its role without inventing a sequential focus target', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const btnBefore = page.getByTestId('btn-before-empty')
    const btnAfter = page.getByTestId('btn-after-empty')
    const emptyTree = page.getByTestId('empty-tree')

    await expect(emptyTree).toHaveAttribute('role', 'tree')
    await expect(emptyTree).not.toHaveAttribute('tabindex', '0')

    await btnBefore.focus()
    await expect(btnBefore).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(btnAfter).toBeFocused()
  })

  test('TR-DOM-10: Tree should keep uncontrolled omission working while controlled omission without callbacks stays put', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    // Re-targeted: uncontrolled mode is preserved (recon exhibit 1), so the
    // omitted-props tree expands and selects through internal state.
    const omittedBranch = page.getByTestId('omitted-branch')
    await expect(omittedBranch).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('omitted-child')).toHaveCount(0)

    await page.getByTestId('omitted-expander').click()
    await expect(omittedBranch).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('omitted-child')).toBeVisible()

    await page.getByText('Omitted Branch', { exact: true }).click()
    await expect(omittedBranch).toHaveAttribute('aria-selected', 'true')

    // Controlled props without callbacks stay put instead.
    const noopBranch = page.getByTestId('noop-branch-item')
    const noopChild = page.getByTestId('noop-child-item')
    await expect(noopBranch).toHaveAttribute('aria-expanded', 'true')
    await expect(noopChild).toBeVisible()

    await page.getByTestId('noop-expander').click()
    await expect(noopBranch).toHaveAttribute('aria-expanded', 'true')
    await expect(noopChild).toBeVisible()

    await noopChild.click()
    await expect(noopChild).toHaveAttribute('aria-selected', 'false')
    await expect(noopBranch).toHaveAttribute('aria-selected', 'true')
  })

  test('TR-DOM-11: Tree Expander should be a named non-tab-stop button linked to its branch Group', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder1 = page.getByTestId('tree-item-folder-1')
    const expander = page.getByTestId('expander-folder-1')
    const group = page.getByTestId('tree-group-folder-1')

    await expect(expander).toHaveAttribute('type', 'button')
    await expect(expander).toHaveAttribute('tabindex', '-1')
    await expect(expander).toHaveAttribute('aria-label', 'Toggle Documents')

    const controlsId = await expander.getAttribute('aria-controls')
    const groupId = await group.getAttribute('id')
    expect(controlsId).toBeTruthy()
    expect(controlsId).toBe(groupId)

    await folder1.focus()
    await expect(folder1).toBeFocused()
  })

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

  test('TR-SELECT-01: Tree should request one controlled selection for each supported item activation', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const log = page.getByTestId('tree-selection-log')

    await page.getByTestId('tree-item-doc-2').click()
    await expect(log).toContainText('doc-2')

    const readme = page.getByTestId('tree-item-readme')
    await readme.focus()
    await page.keyboard.press(' ')
    await expect(log).toContainText('file-readme')

    const charlie = page.getByTestId('tree-item-charlie')
    await charlie.focus()
    await page.keyboard.press('Enter')
    await expect(log).toContainText('charlie')
  })

  test('TR-SELECT-02: Tree should select a branch without implicitly changing its expansion', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    await page.getByTestId('expander-folder-1').click()
    const folder1 = page.getByTestId('tree-item-folder-1')
    await expect(folder1).toHaveAttribute('aria-expanded', 'false')

    await page.getByText('Documents', { exact: true }).click()
    await expect(page.getByTestId('tree-value-display')).toHaveText('Selected: folder-1')
    await expect(folder1).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('tree-item-doc-1')).toHaveCount(0)
  })

  test('TR-SELECT-03: Tree should treat activation of the already-selected item as idempotent', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const doc1 = page.getByTestId('tree-item-doc-1')
    await expect(doc1).toHaveAttribute('aria-selected', 'true')

    const logBefore = await page.getByTestId('tree-selection-log').textContent()
    await doc1.click()
    await expect(page.getByTestId('tree-selection-log')).toHaveText(logBefore ?? '')
  })

  test('TR-SELECT-04: Tree should preserve controlled selection when the parent rejects a request', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    await page.getByTestId('toggle-reject-select').click()

    const doc1 = page.getByTestId('tree-item-doc-1')
    const doc2 = page.getByTestId('tree-item-doc-2')
    await expect(doc1).toHaveAttribute('aria-selected', 'true')

    await doc2.click()
    await expect(doc2).toBeFocused()
    await expect(doc1).toHaveAttribute('aria-selected', 'true')
    await expect(doc2).toHaveAttribute('aria-selected', 'false')
  })

  test('TR-SELECT-05: Tree should apply programmatic selection without moving focus or firing callbacks', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const doc1 = page.getByTestId('tree-item-doc-1')
    await doc1.focus()
    await expect(doc1).toBeFocused()

    const logBefore = await page.getByTestId('tree-selection-log').textContent()
    await page.evaluate(
      () => (document.querySelector('[data-testid="set-value-charlie"]') as HTMLElement)?.click()
    )
    await expect(page.getByTestId('tree-item-charlie')).toHaveAttribute('aria-selected', 'true')
    await expect(doc1).toBeFocused()
    await expect(page.getByTestId('tree-selection-log')).toHaveText(logBefore ?? '')
  })

  test('TR-SELECT-06: Tree should prevent disabled items from being selected by any modality', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const disabledLeaf = page.getByTestId('tree-item-disabled-leaf')
    const display = page.getByTestId('tree-value-display')
    const currentSelected = await display.textContent()

    await disabledLeaf.click({ force: true })
    await expect(display).toHaveText(currentSelected ?? '')

    await disabledLeaf.focus()
    await page.keyboard.press('Enter')
    await expect(display).toHaveText(currentSelected ?? '')

    await page.keyboard.press(' ')
    await expect(display).toHaveText(currentSelected ?? '')
  })

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

  test('TR-SELECT-08: Tree Expander pointer activation should change only expansion', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const expander = page.getByTestId('expander-folder-1')
    const folder1 = page.getByTestId('tree-item-folder-1')
    const display = page.getByTestId('tree-value-display')

    await expect(display).toHaveText('Selected: doc-1')
    await expander.click()

    await expect(folder1).toHaveAttribute('aria-expanded', 'false')
    await expect(display).toHaveText('Selected: doc-1')
  })

  test('TR-EXPAND-01: Tree should request addition of a collapsed branch when its Expander is activated', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    await page.getByTestId('set-expanded-none').click()
    const folder1 = page.getByTestId('tree-item-folder-1')
    await expect(folder1).toHaveAttribute('aria-expanded', 'false')

    await page.getByTestId('expander-folder-1').click()
    await expect(page.getByTestId('tree-expanded-display')).toContainText('folder-1')
  })

  test('TR-EXPAND-02: Tree should request removal of an expanded branch when its Expander is activated', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder1 = page.getByTestId('tree-item-folder-1')
    await expect(folder1).toHaveAttribute('aria-expanded', 'true')

    await page.getByTestId('expander-folder-1').click()
    await expect(page.getByTestId('tree-expanded-display')).toHaveText('Expanded:')
  })

  test('TR-EXPAND-03: Tree should leave branch DOM and ARIA unchanged when expansion is rejected', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    await page.getByTestId('toggle-reject-expand').click()
    const folder1 = page.getByTestId('tree-item-folder-1')
    const expander = page.getByTestId('expander-folder-1')

    await expect(folder1).toHaveAttribute('aria-expanded', 'true')
    await expander.click()
    await expect(folder1).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('tree-item-doc-1')).toBeVisible()
  })

  test('TR-EXPAND-04: Tree should reveal and hide Groups from programmatic expansion updates without side effects', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    await page.getByTestId('set-expanded-none').click()
    await expect(page.getByTestId('tree-item-doc-1')).toHaveCount(0)

    await page.getByTestId('set-expanded-multi').click()
    await expect(page.getByTestId('tree-item-doc-1')).toBeVisible()
    await expect(page.getByTestId('tree-item-nested-doc-1')).toBeVisible()
  })

  test('TR-EXPAND-05: Tree should never offer or request expansion for a leaf', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const readme = page.getByTestId('tree-item-readme')
    await readme.focus()
    await expect(readme).not.toHaveAttribute('aria-expanded')

    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowLeft')
    const expDisplay = page.getByTestId('tree-expanded-display')
    expect(await expDisplay.textContent()).not.toContain('file-readme')
  })

  test('TR-EXPAND-06: Tree should emit deterministic deduplicated expanded arrays in current traversal order', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    await page.getByTestId('det-expander-b').click()
    await expect(page.getByTestId('det-expansion-log')).toContainText('a,b,c,unknown-2,unknown-1')
  })

  test('TR-EXPAND-07: Tree should move focus to a branch before collapsing its focused descendant', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const doc1 = page.getByTestId('tree-item-doc-1')
    const folder1 = page.getByTestId('tree-item-folder-1')

    await doc1.focus()
    await expect(doc1).toBeFocused()

    await page.getByTestId('expander-folder-1').click()

    await expect(folder1).toBeFocused()
    await expect(page.getByTestId('tree-item-doc-1')).toHaveCount(0)
  })

  test("TR-EXPAND-08: Tree should let the Expander's consumer handler cancel its expansion default", async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    await page.getByTestId('expander-cancel-expand').click()

    await expect(page.getByTestId('tree-key-log')).toContainText('expander-preventDefault')
    await expect(page.getByTestId('tree-item-cancel-expand')).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })

  test('TR-EXPAND-09: Tree should keep a disabled branch expansion-controlled while allowing independently enabled descendants', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    await page.getByTestId('toggle-ancestor-disabled').click()
    const disabledBranch = page.getByTestId('tree-item-disabled-branch')
    await expect(disabledBranch).toHaveAttribute('aria-disabled', 'true')

    await page.getByTestId('set-expanded-multi').click()
    const child = page.getByTestId('tree-item-child-under-disabled')
    await expect(child).not.toHaveAttribute('aria-disabled')
    await child.focus()
    await expect(child).toBeFocused()

    // Expander and arrow actions on the disabled branch request nothing
    const logBefore = await page.getByTestId('tree-expansion-log').textContent()
    // Forced: Playwright treats aria-disabled descendants as unactionable,
    // but the pointer event itself must still be ignored by the component.
    await page.getByTestId('expander-disabled-branch').click({ force: true })
    await expect(disabledBranch).toHaveAttribute('aria-expanded', 'true')
    await disabledBranch.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('tree-expansion-log')).toHaveText(logBefore ?? '')
  })

  test('TR-KEY-03: LTR Tree should request expansion on Right while keeping focus on a controlled collapsed branch', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    await page.getByTestId('set-expanded-none').click()
    const folder = page.getByTestId('tree-item-folder-1')
    await folder.focus()
    await expect(folder).toHaveAttribute('aria-expanded', 'false')

    await page.keyboard.press('ArrowRight')
    await expect(folder).toBeFocused()
    await expect(folder).toHaveAttribute('tabindex', '0')
    await expect(folder).toHaveAttribute('aria-expanded', 'true')
  })

  test("TR-KEY-04: LTR Tree should enter an expanded branch's first enabled child on Right and ignore Right on leaves", async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder = page.getByTestId('tree-item-folder-1')
    await folder.focus()
    await expect(folder).toHaveAttribute('aria-expanded', 'true')

    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('tree-item-doc-1')).toBeFocused()

    const readme = page.getByTestId('tree-item-readme')
    await readme.focus()
    await page.keyboard.press('ArrowRight')
    await expect(readme).toBeFocused()
  })

  test('TR-KEY-05: LTR Tree should collapse an expanded branch or move a collapsed item to its parent on Left', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder = page.getByTestId('tree-item-folder-1')
    await folder.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(folder).toHaveAttribute('aria-expanded', 'false')

    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    const doc2 = page.getByTestId('tree-item-doc-2')
    await expect(doc2).toBeFocused()

    await page.keyboard.press('ArrowLeft')
    await expect(folder).toBeFocused()
  })

  test('TR-KEY-06: RTL Tree should mirror horizontal hierarchy keys without changing vertical traversal', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    await page.getByTestId('toggle-rtl').click()
    const folder = page.getByTestId('tree-item-folder-1')
    await folder.focus()

    await page.keyboard.press('ArrowRight')
    await expect(folder).toHaveAttribute('aria-expanded', 'false')

    await page.keyboard.press('ArrowLeft')
    await expect(folder).toHaveAttribute('aria-expanded', 'true')

    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('tree-item-doc-1')).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(folder).toBeFocused()
  })

  test('TR-KEY-07: Tree navigation should skip each disabled item without implicitly disabling its descendants', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const readme = page.getByTestId('tree-item-readme')
    await readme.focus()

    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('tree-item-charlie')).toBeFocused()
  })

  test('TR-KEY-08: Tree should exclude every collapsed descendant from all keyboard and search paths', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    await page.getByTestId('expander-folder-1').click()

    const folder = page.getByTestId('tree-item-folder-1')
    await folder.focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('tree-item-readme')).toBeFocused()
  })

  test('TR-KEY-09: Tree arrow navigation should move focus without changing controlled selection', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const display = page.getByTestId('tree-value-display')
    await expect(display).toHaveText('Selected: doc-1')

    const folder = page.getByTestId('tree-item-folder-1')
    await folder.focus()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')

    await expect(display).toHaveText('Selected: doc-1')
  })

  test('TR-KEY-10: Tree should preserve keyboard ownership for editable and interactive item descendants', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const input = page.getByTestId('item-nested-input')
    await input.focus()
    await input.fill('hello')
    await expect(input).toHaveValue('hello')

    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowRight')
    await expect(input).toBeFocused()

    const display = page.getByTestId('tree-value-display')
    const button = page.getByTestId('item-nested-button')
    await button.focus()
    await page.keyboard.press(' ')
    await expect(button).toBeFocused()
    await expect(display).toHaveText('Selected: doc-1')
    await page.keyboard.press('Enter')
    await expect(button).toBeFocused()
    await expect(display).toHaveText('Selected: doc-1')
  })

  test('TR-KEY-11: Tree should honor consumer key cancellation and leave unsupported modified keys untouched', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const cancelItem = page.getByTestId('tree-item-cancel-key')
    await cancelItem.focus()

    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('tree-key-log')).toContainText('cancelled-ArrowDown')
    await expect(cancelItem).toBeFocused()

    const folder = page.getByTestId('tree-item-folder-1')
    await folder.focus()
    await page.keyboard.press('Alt+ArrowDown')
    await expect(folder).toBeFocused()
    await page.keyboard.press('Control+ArrowDown')
    await expect(folder).toBeFocused()
  })

  test('TR-TYPE-01: Tree typeahead should wrap through enabled visible items in depth-first order', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder = page.getByTestId('tree-item-folder-1')
    await folder.focus()

    await page.keyboard.type('c')
    await expect(page.getByTestId('tree-item-charlie')).toBeFocused()
  })

  test('TR-TYPE-02: Tree typeahead should ignore a matching descendant when its ancestor is collapsed', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    await page.getByTestId('expander-folder-1').click()

    const readme = page.getByTestId('tree-item-readme')
    await readme.focus()

    await page.keyboard.type('r')
    await expect(readme).toBeFocused()
    await expect(page.getByTestId('tree-item-folder-1')).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('tree-selection-log')).toHaveText('SelectionLog:')
  })

  test('TR-TYPE-03: Tree typeahead should use the current visible set when expansion changes mid-buffer', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder = page.getByTestId('tree-item-folder-1')
    await folder.focus()

    await page.keyboard.type('a')
    await expect(page.getByTestId('tree-item-subfolder-1')).toBeFocused()

    // Collapse mid-buffer through a fast path, then continue typing at once.
    // Buffer 'ar' would match Archive if it were still mounted; a fresh 'r'
    // would match README instead. Staying put proves survival + ineligibility.
    await page.evaluate(
      () => (document.querySelector('[data-testid="expander-folder-1"]') as HTMLElement)?.click()
    )
    await page.keyboard.type('r')
    await expect(folder).toBeFocused()
    await expect(page.getByTestId('tree-item-subfolder-1')).toHaveCount(0)

    // Fresh buffer still skips the hidden Archive
    await page.waitForTimeout(2500)
    await folder.focus()
    await page.keyboard.type('a')
    await expect(page.getByTestId('tree-item-alpha')).toBeFocused()

    // Newly visible matches are immediately eligible
    await page.waitForTimeout(2500)
    await page.evaluate(
      () => (document.querySelector('[data-testid="set-expanded-multi"]') as HTMLElement)?.click()
    )
    await expect(page.getByTestId('tree-item-subfolder-1')).toBeVisible()
    await folder.focus()
    await page.keyboard.type('a')
    await expect(page.getByTestId('tree-item-subfolder-1')).toBeFocused()
  })

  test('TR-TYPE-04: Tree should integrate the full RovingFocus typeahead session for visible items', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder = page.getByTestId('tree-item-folder-1')
    const display = page.getByTestId('tree-value-display')
    await folder.focus()

    // Repeated characters cycle same-letter matches and wrap
    await page.keyboard.type('c')
    await expect(page.getByTestId('tree-item-charlie')).toBeFocused()
    await page.keyboard.type('c')
    await expect(page.getByTestId('tree-item-cancel-key')).toBeFocused()
    await page.keyboard.type('c')
    await expect(page.getByTestId('tree-item-cancel-expand')).toBeFocused()
    await page.keyboard.type('c')
    await expect(page.getByTestId('tree-item-creme')).toBeFocused()
    await page.keyboard.type('c')
    await expect(page.getByTestId('tree-item-charlie')).toBeFocused()

    // Multi-character prefix narrows to the diacritic label. No reset needed:
    // repeat-'c' from the refocused folder lands where a fresh 'c' would.
    await folder.focus()
    await page.keyboard.type('cr')
    await expect(page.getByTestId('tree-item-creme')).toBeFocused()

    // Timeout reset starts a fresh buffer (generous margin for loaded CI)
    await page.waitForTimeout(2500)
    await page.keyboard.type('b')
    await expect(page.getByTestId('tree-item-doc-2')).toBeFocused()

    // No match preserves focus and selects nothing; the stale 'b' buffer is
    // unobservable here since every probe is a no-match either way.
    await folder.focus()
    await page.keyboard.type('xq')
    await expect(folder).toBeFocused()
    await expect(display).toHaveText('Selected: doc-1')

    // Space extends the active buffer instead of selecting
    await page.keyboard.press(' ')
    await expect(folder).toBeFocused()
    await expect(display).toHaveText('Selected: doc-1')

    // Space after timeout selects the focused item
    await page.waitForTimeout(2500)
    await page.keyboard.press(' ')
    await expect(display).toHaveText('Selected: folder-1')
  })

  test('TR-TYPE-05: Tree typeahead should prefer current explicit textValue over nested or decorative text', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder = page.getByTestId('tree-item-folder-1')
    const item = page.getByTestId('tree-item-typeahead-override')
    await folder.focus()

    // Initially labeled Zulu
    await page.keyboard.type('z')
    await expect(item).toBeFocused()

    // Dynamic label change is matched
    await page.waitForTimeout(2500)
    await page.getByTestId('set-label-rainbow').click()
    await expect(item).toHaveText('Rainbow')
    await folder.focus()
    await page.keyboard.type('rrr')
    await expect(item).toBeFocused()

    // Explicit textValue wins over the rendered label
    await page.waitForTimeout(2500)
    await page.evaluate(
      () => (document.querySelector('[data-testid="set-textvalue-bravo"]') as HTMLElement)?.click()
    )
    await expect(item).toHaveAttribute('data-text-value', 'Bravo')
    await folder.focus()
    await page.keyboard.type('bb')
    await expect(item).toBeFocused()

    // Stale label no longer matches once overridden
    await page.waitForTimeout(2500)
    await folder.focus()
    await page.keyboard.type('rrr')
    await expect(page.getByTestId('tree-item-doc-1')).toBeFocused()
  })

  test('TR-DYNAMIC-03: Tree should recover focus predictably when the focused item is removed', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const doc1 = page.getByTestId('tree-item-doc-1')
    await doc1.focus()
    await expect(doc1).toBeFocused()

    await page.getByTestId('remove-doc-1').click()
    await expect(page.getByTestId('tree-item-doc-2')).toBeFocused()

    await page.getByTestId('remove-doc-2').click()
    await expect(page.getByTestId('tree-item-subfolder-1')).toBeFocused()

    const override = page.getByTestId('tree-item-typeahead-override')
    await override.focus()
    await page.getByTestId('remove-override').click()
    await expect(page.getByTestId('tree-item-path-branch')).toBeFocused()

    await page.getByTestId('clear-main-items').click()
    const tree = page.getByTestId('test-tree')
    await expect(tree).toBeFocused()
    await expect(tree).toHaveAttribute('tabindex', '-1')
  })

  test('TR-DYNAMIC-04: Tree should preserve controlled selected and expanded values after their items unmount', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const display = page.getByTestId('tree-value-display')
    await expect(display).toHaveText('Selected: doc-1')

    await page.getByTestId('remove-doc-1').click()
    await expect(display).toHaveText('Selected: doc-1')
  })

  test('TR-DYNAMIC-05: Tree should update semantics and keys when an item changes between leaf and branch', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const alpha = page.getByTestId('tree-item-alpha')
    await expect(alpha).not.toHaveAttribute('aria-expanded')

    await page.getByTestId('toggle-alpha-branch').click()
    await expect(alpha).toHaveAttribute('aria-expanded', 'false')

    await alpha.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('tree-item-alpha-child')).toBeVisible()
    await expect(alpha).toHaveAttribute('aria-expanded', 'true')

    await page.getByTestId('toggle-alpha-branch').click()
    await expect(alpha).not.toHaveAttribute('aria-expanded')
    await expect(page.getByTestId('tree-item-alpha-child')).toHaveCount(0)

    await alpha.focus()
    await page.keyboard.press('ArrowRight')
    await expect(alpha).toBeFocused()
    await expect(page.getByTestId('tree-item-alpha-child')).toHaveCount(0)
  })

  test('TR-DYNAMIC-06: Tree should remove stale navigation targets when current or ancestor disabled state changes', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const disabledBranch = page.getByTestId('tree-item-disabled-branch')
    await disabledBranch.focus()
    await expect(disabledBranch).toBeFocused()

    await page.getByTestId('toggle-ancestor-disabled').click()
    await expect(disabledBranch).toHaveAttribute('aria-disabled', 'true')

    // Focus and the tab stop recover to a valid enabled visible item
    const interactive = page.getByTestId('tree-item-interactive')
    await expect(interactive).toBeFocused()
    await expect(interactive).toHaveAttribute('tabindex', '0')
    await expect(disabledBranch).toHaveAttribute('tabindex', '-1')
  })

  test('TR-A11Y-01: Tree should pass accessibility checks across every frozen hierarchy state', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const tree = page.getByTestId('test-tree')
    await expect(tree).toHaveAttribute('role', 'tree')

    const items = tree.locator('[role="treeitem"]')
    expect(await items.count()).toBeGreaterThan(0)
    const count = await items.count()
    for (let i = 0; i < count; i++) {
      const item = items.nth(i)
      expect(Number(await item.getAttribute('aria-level'))).toBeGreaterThanOrEqual(1)
      const posinset = Number(await item.getAttribute('aria-posinset'))
      const setsize = Number(await item.getAttribute('aria-setsize'))
      expect(posinset).toBeGreaterThanOrEqual(1)
      expect(setsize).toBeGreaterThanOrEqual(posinset)
    }

    const folder1 = page.getByTestId('tree-item-folder-1')
    await expect(folder1).toHaveAttribute('aria-expanded', 'true')
    await expect(folder1).toHaveAttribute('data-expanded', '')
    await expect(page.getByTestId('tree-item-doc-1')).toHaveAttribute('data-selected', '')

    await page.getByTestId('set-expanded-multi').click()
    for (const expanderId of [
      'expander-folder-1',
      'expander-subfolder-1',
      'expander-disabled-branch',
    ]) {
      const controlsId = await page.getByTestId(expanderId).getAttribute('aria-controls')
      const groupRole = await page.evaluate(
        (id) => (id ? document.getElementById(id)?.getAttribute('role') : null),
        controlsId
      )
      expect(groupRole).toBe('group')
    }
  })

  test('TR-COMP-01: Tree should support a controlled two-level navigation composition with mixed leaves and branches', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const display = page.getByTestId('tree-value-display')
    const folder = page.getByTestId('tree-item-folder-1')

    await page.getByTestId('tree-item-doc-2').click()
    await expect(display).toHaveText('Selected: doc-2')

    await page.getByTestId('expander-folder-1').click()
    await expect(page.getByTestId('tree-item-doc-1')).toHaveCount(0)
    await page.getByTestId('expander-folder-1').click()
    await expect(page.getByTestId('tree-item-doc-1')).toBeVisible()

    await folder.focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('tree-item-doc-1')).toBeFocused()

    await page.getByTestId('toggle-rtl').click()
    await folder.focus()
    await page.keyboard.press('ArrowRight')
    await expect(folder).toHaveAttribute('aria-expanded', 'false')
    await page.keyboard.press('ArrowLeft')
    await expect(folder).toHaveAttribute('aria-expanded', 'true')
    await page.getByTestId('toggle-rtl').click()

    await page.getByTestId('tree-item-readme').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('tree-item-charlie')).toBeFocused()

    await page.getByTestId('tree-item-doc-1').focus()
    await page.getByTestId('remove-doc-1').click()
    await expect(page.getByTestId('tree-item-doc-2')).toBeFocused()
  })

  test("TR-COMP-02: Tree should keep collapsed descendants out of a three-level composition's visible set", async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const expanderSub = page.getByTestId('expander-subfolder-1')
    await expect(page.getByTestId('tree-item-nested-doc-1')).toHaveCount(0)

    await expanderSub.click()
    await expect(page.getByTestId('tree-item-nested-doc-1')).toBeVisible()

    await page.getByTestId('tree-item-nested-doc-1').click()
    await expect(page.getByTestId('tree-value-display')).toHaveText('Selected: nested-doc-1')

    await expanderSub.click()
    await expect(page.getByTestId('tree-item-nested-doc-1')).toHaveCount(0)
    await expect(page.getByTestId('tree-value-display')).toHaveText('Selected: nested-doc-1')

    await expanderSub.click()
    await expect(page.getByTestId('tree-item-nested-doc-1')).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })

  test('TR-ENV-03: Tree should discover focus and traverse visible hierarchy inside a ShadowRoot', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Shadow')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const host = page.getByTestId('tree-shadow-host')
    const docs = page.getByTestId('tree-shadow-item-docs')
    const resume = page.getByTestId('tree-shadow-item-resume')
    const budget = page.getByTestId('tree-shadow-item-budget')
    const readme = page.getByTestId('tree-shadow-item-readme')
    const notes = page.getByTestId('tree-shadow-item-notes')
    const display = page.getByTestId('tree-shadow-value-display')
    const expandedDisplay = page.getByTestId('tree-shadow-expanded-display')

    await expect(docs).toBeVisible()
    await expect(docs).toHaveAttribute('aria-expanded', 'true')

    // Owning-root focus discovery: the document sees only the host while the
    // shadow root holds the real focused item — Tree never consults
    // document.activeElement.
    await docs.getByText('Documents').click()
    await expect(docs).toBeFocused()
    await expect(display).toHaveText('Selected: shadow-docs')
    const docActive = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.dataset?.testid ?? null
    )
    expect(docActive).not.toBe('tree-shadow-item-docs')
    const shadowActive = () =>
      host.evaluate(
        (el) =>
          (el.shadowRoot?.activeElement as HTMLElement | null)?.dataset?.testid ?? null
      )
    await expect.poll(shadowActive).toBe('tree-shadow-item-docs')

    // Vertical traversal matches light DOM.
    await page.keyboard.press('ArrowDown')
    await expect(resume).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(budget).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(resume).toBeFocused()

    // Home/End.
    await page.keyboard.press('End')
    await expect(notes).toBeFocused()
    await page.keyboard.press('Home')
    await expect(docs).toBeFocused()

    // Horizontal: collapse removes children from the visible set...
    await page.keyboard.press('ArrowLeft')
    await expect(docs).toHaveAttribute('aria-expanded', 'false')
    await expect(resume).toHaveCount(0)
    await expect(expandedDisplay).not.toContainText('shadow-docs')
    await page.keyboard.press('ArrowDown')
    await expect(readme).toBeFocused()

    // ...and expand restores them, focusing the first child on second press.
    await docs.focus()
    await page.keyboard.press('ArrowRight')
    await expect(docs).toHaveAttribute('aria-expanded', 'true')
    await expect(resume).toBeVisible()
    await expect(expandedDisplay).toContainText('shadow-docs')
    await page.keyboard.press('ArrowRight')
    await expect(resume).toBeFocused()

    // Typeahead over the visible set, then Enter commits through onChange.
    await page.keyboard.press('b')
    await expect(budget).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(display).toHaveText('Selected: shadow-budget')

    // RTL resolved through the light-DOM host chain: ArrowLeft expands.
    const rtlDocs = page.getByTestId('tree-shadow-rtl-item-docs')
    const rtlExpander = page.getByTestId('tree-shadow-rtl-expander-docs')
    await expect(rtlDocs).toBeVisible()
    await rtlExpander.click()
    await expect(rtlDocs).toHaveAttribute('aria-expanded', 'false')
    await rtlDocs.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(rtlDocs).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('ArrowRight')
    await expect(rtlDocs).toHaveAttribute('aria-expanded', 'false')
  })
})
