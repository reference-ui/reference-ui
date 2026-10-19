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
  test('TR-EXPAND-01: Tree should request addition of a collapsed branch when its Expander is activated', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    await page.getByTestId('set-expanded-none').click()
    const folder1 = page.getByTestId('tree-item-folder-1')
    await expect(folder1).toHaveAttribute('aria-expanded', 'false')

    await page.getByTestId('expander-folder-1').click()
    await expect(page.getByTestId('tree-expanded-display')).toContainText('folder-1')
  })
});
