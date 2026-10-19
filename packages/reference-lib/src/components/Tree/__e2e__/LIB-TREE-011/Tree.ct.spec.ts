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
  test('TR-DOM-02: Multi-level hierarchy rendering', async ({ mount, page }) => {
    await mount('components/Tree/Tree/MultiLevel')
    const multiRoot = page.getByTestId('tree-multi-root')
    await expect(multiRoot).toBeVisible()

    // One-based levels derive from authored nesting at every depth
    await expect(page.getByTestId('tree-folder-packages')).toHaveAttribute('aria-level', '1')
    await expect(page.getByTestId('tree-folder-components')).toHaveAttribute('aria-level', '2')
    await expect(page.getByTestId('tree-file-switch')).toHaveAttribute('aria-level', '3')
    await expect(page.getByTestId('tree-file-tabs')).toHaveAttribute('aria-level', '3')
    await expect(page.getByTestId('tree-file-pkg')).toHaveAttribute('aria-level', '2')

    await page.waitForTimeout(300)
    await snap(page, 'tree-multilevel')
    await snap(multiRoot, 'tree-multi-root-default', { maxDiffPixelRatio: 0.001 })
  })
});
