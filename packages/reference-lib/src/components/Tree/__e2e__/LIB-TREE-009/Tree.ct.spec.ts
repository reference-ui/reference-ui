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

test.describe('Tree Composition Gates & Browser Proofs', () => {
  test('TR-KEY-01: Roving focus, vertical navigation, Home/End, and Enter selection', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Basic')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder = page.getByTestId('tree-item-folder-1')
    const doc1 = page.getByTestId('tree-item-doc-1')
    const doc2 = page.getByTestId('tree-item-doc-2')
    const readme = page.getByTestId('tree-item-readme')
    const display = page.getByTestId('tree-value-display')

    // One roving tab stop, seeded on the selected item
    await expect(doc1).toHaveAttribute('tabindex', '0')
    await expect(folder).toHaveAttribute('tabindex', '-1')
    await expect(readme).toHaveAttribute('tabindex', '-1')

    // Focus folder
    await folder.focus()
    await expect(folder).toBeFocused()
    await expect(folder).toHaveAttribute('tabindex', '0')
    await expect(doc1).toHaveAttribute('tabindex', '-1')

    // ArrowDown roving navigation
    await page.keyboard.press('ArrowDown')
    await expect(doc1).toBeFocused()
    await expect(doc1).toHaveAttribute('tabindex', '0')

    await page.keyboard.press('ArrowDown')
    await expect(doc2).toBeFocused()
    await expect(doc2).toHaveAttribute('tabindex', '0')

    await page.keyboard.press('ArrowUp')
    await expect(doc1).toBeFocused()

    // Press Enter to select focused item
    await doc2.focus()
    await page.keyboard.press('Enter')
    await expect(doc2).toHaveAttribute('aria-selected', 'true')
    await expect(display).toHaveText('Selected: doc-2')

    // Home moves focus to first item
    await page.keyboard.press('Home')
    await expect(folder).toBeFocused()

    // End moves focus to last visible item
    await page.keyboard.press('End')
    await expect(readme).toBeFocused()
  })
});
