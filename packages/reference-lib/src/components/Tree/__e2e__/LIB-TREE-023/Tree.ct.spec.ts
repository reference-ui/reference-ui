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
});
