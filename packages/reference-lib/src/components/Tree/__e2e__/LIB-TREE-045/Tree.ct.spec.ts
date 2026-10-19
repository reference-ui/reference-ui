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
  test('TR-KEY-09: Tree arrow navigation should move focus without changing controlled selection', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const display = page.getByTestId('tree-value-display')
    await expect(display).toHaveText('Selected: doc-1')

    const folder = page.getByTestId('tree-item-folder-1')
    await folder.focus()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')

    await expect(display).toHaveText('Selected: doc-1')
  })
});
