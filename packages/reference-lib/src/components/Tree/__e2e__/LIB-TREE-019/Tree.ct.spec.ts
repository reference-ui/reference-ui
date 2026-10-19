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
  test('TR-DOM-10: Tree should expand and select through state when only expansion props are omitted', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    // Re-targeted (controlled-only): selection is state-driven, so the
    // auxiliary tree expands through default expansion and selects through
    // its onChange state. Callback-less frozen trees are gone — omitting
    // value/onChange fails fast (unit TR-API-01/TR-API-02); staying put on
    // a rejecting parent is covered by TR-SELECT-04/TR-EXPAND-03.
    const omittedBranch = page.getByTestId('omitted-branch')
    await expect(omittedBranch).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('omitted-child')).toHaveCount(0)

    await page.getByTestId('omitted-expander').click()
    await expect(omittedBranch).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByTestId('omitted-child')).toBeVisible()

    await page.getByText('Omitted Branch', { exact: true }).click()
    await expect(omittedBranch).toHaveAttribute('aria-selected', 'true')
  })
});
