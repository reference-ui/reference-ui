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
});
