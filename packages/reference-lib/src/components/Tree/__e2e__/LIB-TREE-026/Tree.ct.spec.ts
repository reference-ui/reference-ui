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
  test('TR-SELECT-05: Tree should apply programmatic selection without moving focus or firing callbacks', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const doc1 = page.getByTestId('tree-item-doc-1')
    await doc1.focus()
    await expect(doc1).toBeFocused()

    const logBefore = await page.getByTestId('tree-selection-log').textContent()
    await page.evaluate(
      () => (document.querySelector('[data-testid="set-value-charlie"]') as HTMLElement)?.click()
    )
    await expect(page.getByTestId('tree-item-charlie')).toHaveAttribute('aria-selected', 'true')
    await expect(doc1).toBeFocused()
    await expect(page.getByTestId('tree-selection-log')).toHaveText(logBefore ?? '')
  })
});
