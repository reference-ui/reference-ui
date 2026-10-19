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
});
