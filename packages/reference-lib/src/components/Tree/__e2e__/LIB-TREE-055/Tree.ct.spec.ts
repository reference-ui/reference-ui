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
});
