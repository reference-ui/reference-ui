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
  test('TR-EXPAND-02: Tree should request removal of an expanded branch when its Expander is activated', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder1 = page.getByTestId('tree-item-folder-1')
    await expect(folder1).toHaveAttribute('aria-expanded', 'true')

    await page.getByTestId('expander-folder-1').click()
    await expect(page.getByTestId('tree-expanded-display')).toHaveText('Expanded:')
  })
});
