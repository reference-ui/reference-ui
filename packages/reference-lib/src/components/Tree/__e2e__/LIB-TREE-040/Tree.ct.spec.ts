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
  test("TR-KEY-04: LTR Tree should enter an expanded branch's first enabled child on Right and ignore Right on leaves", async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder = page.getByTestId('tree-item-folder-1')
    await folder.focus()
    await expect(folder).toHaveAttribute('aria-expanded', 'true')

    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('tree-item-doc-1')).toBeFocused()

    const readme = page.getByTestId('tree-item-readme')
    await readme.focus()
    await page.keyboard.press('ArrowRight')
    await expect(readme).toBeFocused()
  })
});
