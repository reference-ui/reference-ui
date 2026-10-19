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
  test('TR-TYPE-02: Tree typeahead should ignore a matching descendant when its ancestor is collapsed', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    await page.getByTestId('expander-folder-1').click()

    const readme = page.getByTestId('tree-item-readme')
    await readme.focus()

    await page.keyboard.type('r')
    await expect(readme).toBeFocused()
    await expect(page.getByTestId('tree-item-folder-1')).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('tree-selection-log')).toHaveText('SelectionLog:')
  })
});
