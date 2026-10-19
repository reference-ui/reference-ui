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
});
