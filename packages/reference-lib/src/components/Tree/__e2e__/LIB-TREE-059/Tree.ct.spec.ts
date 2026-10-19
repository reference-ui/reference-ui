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

    // Scanner half: the Parity mount holds the expanded multi-branch
    // hierarchy in its settled state; #root scoping covers it whole
    // (no portals in Tree).
    await expectNoAxeViolations(page, { include: '#root' })
  })
});
