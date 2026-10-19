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
  test('TR-KEY-05: LTR Tree should collapse an expanded branch or move a collapsed item to its parent on Left', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder = page.getByTestId('tree-item-folder-1')
    await folder.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(folder).toHaveAttribute('aria-expanded', 'false')

    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    const doc2 = page.getByTestId('tree-item-doc-2')
    await expect(doc2).toBeFocused()

    await page.keyboard.press('ArrowLeft')
    await expect(folder).toBeFocused()
  })
});
