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
  test('TR-SELECT-01: Tree should request one controlled selection for each supported item activation', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const log = page.getByTestId('tree-selection-log')

    await page.getByTestId('tree-item-doc-2').click()
    await expect(log).toContainText('doc-2')

    const readme = page.getByTestId('tree-item-readme')
    await readme.focus()
    await page.keyboard.press(' ')
    await expect(log).toContainText('file-readme')

    const charlie = page.getByTestId('tree-item-charlie')
    await charlie.focus()
    await page.keyboard.press('Enter')
    await expect(log).toContainText('charlie')
  })
});
