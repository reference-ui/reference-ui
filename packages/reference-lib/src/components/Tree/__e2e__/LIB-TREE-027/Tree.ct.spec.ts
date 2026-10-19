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
  test('TR-SELECT-06: Tree should prevent disabled items from being selected by any modality', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const disabledLeaf = page.getByTestId('tree-item-disabled-leaf')
    const display = page.getByTestId('tree-value-display')
    const currentSelected = await display.textContent()

    await disabledLeaf.click({ force: true })
    await expect(display).toHaveText(currentSelected ?? '')

    await disabledLeaf.focus()
    await page.keyboard.press('Enter')
    await expect(display).toHaveText(currentSelected ?? '')

    await page.keyboard.press(' ')
    await expect(display).toHaveText(currentSelected ?? '')
  })
});
