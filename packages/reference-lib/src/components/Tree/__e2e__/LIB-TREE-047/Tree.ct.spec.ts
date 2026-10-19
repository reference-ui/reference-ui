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
  test('TR-KEY-11: Tree should honor consumer key cancellation and leave unsupported modified keys untouched', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const cancelItem = page.getByTestId('tree-item-cancel-key')
    await cancelItem.focus()

    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('tree-key-log')).toContainText('cancelled-ArrowDown')
    await expect(cancelItem).toBeFocused()

    const folder = page.getByTestId('tree-item-folder-1')
    await folder.focus()
    await page.keyboard.press('Alt+ArrowDown')
    await expect(folder).toBeFocused()
    await page.keyboard.press('Control+ArrowDown')
    await expect(folder).toBeFocused()
  })
});
