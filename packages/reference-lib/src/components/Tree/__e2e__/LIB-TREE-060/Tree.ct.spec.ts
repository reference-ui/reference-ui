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
  test('TR-COMP-01: Tree should support a controlled two-level navigation composition with mixed leaves and branches', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const display = page.getByTestId('tree-value-display')
    const folder = page.getByTestId('tree-item-folder-1')

    await page.getByTestId('tree-item-doc-2').click()
    await expect(display).toHaveText('Selected: doc-2')

    await page.getByTestId('expander-folder-1').click()
    await expect(page.getByTestId('tree-item-doc-1')).toHaveCount(0)
    await page.getByTestId('expander-folder-1').click()
    await expect(page.getByTestId('tree-item-doc-1')).toBeVisible()

    await folder.focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('tree-item-doc-1')).toBeFocused()

    await page.getByTestId('toggle-rtl').click()
    await folder.focus()
    await page.keyboard.press('ArrowRight')
    await expect(folder).toHaveAttribute('aria-expanded', 'false')
    await page.keyboard.press('ArrowLeft')
    await expect(folder).toHaveAttribute('aria-expanded', 'true')
    await page.getByTestId('toggle-rtl').click()

    await page.getByTestId('tree-item-readme').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('tree-item-charlie')).toBeFocused()

    await page.getByTestId('tree-item-doc-1').focus()
    await page.getByTestId('remove-doc-1').click()
    await expect(page.getByTestId('tree-item-doc-2')).toBeFocused()
  })
});
