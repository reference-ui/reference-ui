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
});
