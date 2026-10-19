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
});
