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
  test('TR-DYNAMIC-06: Tree should remove stale navigation targets when current or ancestor disabled state changes', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const disabledBranch = page.getByTestId('tree-item-disabled-branch')
    await disabledBranch.focus()
    await expect(disabledBranch).toBeFocused()

    await page.getByTestId('toggle-ancestor-disabled').click()
    await expect(disabledBranch).toHaveAttribute('aria-disabled', 'true')

    // Focus and the tab stop recover to a valid enabled visible item
    const interactive = page.getByTestId('tree-item-interactive')
    await expect(interactive).toBeFocused()
    await expect(interactive).toHaveAttribute('tabindex', '0')
    await expect(disabledBranch).toHaveAttribute('tabindex', '-1')
  })
});
