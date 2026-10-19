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
  test('TR-TYPE-04: Tree should integrate the full RovingFocus typeahead session for visible items', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder = page.getByTestId('tree-item-folder-1')
    const display = page.getByTestId('tree-value-display')
    await folder.focus()

    // Repeated characters cycle same-letter matches and wrap
    await page.keyboard.type('c')
    await expect(page.getByTestId('tree-item-charlie')).toBeFocused()
    await page.keyboard.type('c')
    await expect(page.getByTestId('tree-item-cancel-key')).toBeFocused()
    await page.keyboard.type('c')
    await expect(page.getByTestId('tree-item-cancel-expand')).toBeFocused()
    await page.keyboard.type('c')
    await expect(page.getByTestId('tree-item-creme')).toBeFocused()
    await page.keyboard.type('c')
    await expect(page.getByTestId('tree-item-charlie')).toBeFocused()

    // Multi-character prefix narrows to the diacritic label. No reset needed:
    // repeat-'c' from the refocused folder lands where a fresh 'c' would.
    await folder.focus()
    await page.keyboard.type('cr')
    await expect(page.getByTestId('tree-item-creme')).toBeFocused()

    // Timeout reset starts a fresh buffer (generous margin for loaded CI)
    await page.waitForTimeout(2500)
    await page.keyboard.type('b')
    await expect(page.getByTestId('tree-item-doc-2')).toBeFocused()

    // No match preserves focus and selects nothing; the stale 'b' buffer is
    // unobservable here since every probe is a no-match either way.
    await folder.focus()
    await page.keyboard.type('xq')
    await expect(folder).toBeFocused()
    await expect(display).toHaveText('Selected: doc-1')

    // Space extends the active buffer instead of selecting
    await page.keyboard.press(' ')
    await expect(folder).toBeFocused()
    await expect(display).toHaveText('Selected: doc-1')

    // Space after timeout selects the focused item
    await page.waitForTimeout(2500)
    await page.keyboard.press(' ')
    await expect(display).toHaveText('Selected: folder-1')
  })
});
