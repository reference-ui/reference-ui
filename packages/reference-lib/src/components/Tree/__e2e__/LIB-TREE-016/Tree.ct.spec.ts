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
});
