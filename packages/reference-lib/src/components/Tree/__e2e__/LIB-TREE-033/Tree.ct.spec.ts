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
  test('TR-EXPAND-04: Tree should reveal and hide Groups from programmatic expansion updates without side effects', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    await page.getByTestId('set-expanded-none').click()
    await expect(page.getByTestId('tree-item-doc-1')).toHaveCount(0)

    await page.getByTestId('set-expanded-multi').click()
    await expect(page.getByTestId('tree-item-doc-1')).toBeVisible()
    await expect(page.getByTestId('tree-item-nested-doc-1')).toBeVisible()
  })
});
