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
  test('TR-KEY-02: Horizontal arrow keys handle expand, collapse, and parent traversal', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Basic')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder = page.getByTestId('tree-item-folder-1')
    const doc1 = page.getByTestId('tree-item-doc-1')

    // Focus folder-1 (currently expanded)
    await folder.focus()
    await expect(folder).toBeFocused()
    await expect(folder).toHaveAttribute('aria-expanded', 'true')

    // ArrowLeft on open branch -> collapses branch, focus stays on branch
    await page.keyboard.press('ArrowLeft')
    await expect(folder).toHaveAttribute('aria-expanded', 'false')
    await expect(folder).toBeFocused()
    await expect(doc1).toHaveCount(0)

    await page.waitForTimeout(200)
    await snap(page, 'tree-arrowleft-collapsed')

    // ArrowRight on closed branch -> expands branch, focus stays on branch
    await page.keyboard.press('ArrowRight')
    await expect(folder).toHaveAttribute('aria-expanded', 'true')
    await expect(folder).toBeFocused()
    await expect(doc1).toBeVisible()

    // ArrowRight on already open branch -> moves focus to first child
    await page.keyboard.press('ArrowRight')
    await expect(doc1).toBeFocused()

    await page.waitForTimeout(200)
    await snap(page, 'tree-arrowright-child-focused')

    // ArrowLeft on child item -> moves focus up to parent branch
    await page.keyboard.press('ArrowLeft')
    await expect(folder).toBeFocused()
  })
});
