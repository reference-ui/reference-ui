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
  test('TR-DYNAMIC-05: Tree should update semantics and keys when an item changes between leaf and branch', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const alpha = page.getByTestId('tree-item-alpha')
    await expect(alpha).not.toHaveAttribute('aria-expanded')

    await page.getByTestId('toggle-alpha-branch').click()
    await expect(alpha).toHaveAttribute('aria-expanded', 'false')

    await alpha.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('tree-item-alpha-child')).toBeVisible()
    await expect(alpha).toHaveAttribute('aria-expanded', 'true')

    await page.getByTestId('toggle-alpha-branch').click()
    await expect(alpha).not.toHaveAttribute('aria-expanded')
    await expect(page.getByTestId('tree-item-alpha-child')).toHaveCount(0)

    await alpha.focus()
    await page.keyboard.press('ArrowRight')
    await expect(alpha).toBeFocused()
    await expect(page.getByTestId('tree-item-alpha-child')).toHaveCount(0)
  })
});
