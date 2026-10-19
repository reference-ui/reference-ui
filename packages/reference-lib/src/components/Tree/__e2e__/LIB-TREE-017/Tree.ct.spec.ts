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
  test('TR-DOM-08: Tree should reject duplicate item values while preserving path-like and zero-like strings as opaque identities', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    // Zero-like identity selects without truthiness coercion
    await page.getByTestId('tree-item-zero').click()
    await expect(page.getByTestId('tree-value-display')).toHaveText('Selected: 0')

    // Digit-leading labels search by their digits, not stripped decoration
    await page.getByTestId('tree-item-folder-1').focus()
    await page.keyboard.type('0')
    await expect(page.getByTestId('tree-item-zero')).toBeFocused()

    // Path-like branch identity expands without path parsing
    await page.getByTestId('expander-path').click()
    await expect(page.getByTestId('tree-item-path-child')).toBeVisible()
    await expect(page.getByTestId('tree-item-path-branch')).toHaveAttribute('aria-expanded', 'true')

    // A duplicate identity throws a descriptive error instead of going ambiguous
    const [pageError] = await Promise.all([
      page.waitForEvent('pageerror'),
      page.getByTestId('toggle-duplicate').click(),
    ])
    expect(pageError.message).toContain('Duplicate')
  })
});
