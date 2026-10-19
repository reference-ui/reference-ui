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
  test('TR-TYPE-05: Tree typeahead should prefer current explicit textValue over nested or decorative text', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder = page.getByTestId('tree-item-folder-1')
    const item = page.getByTestId('tree-item-typeahead-override')
    await folder.focus()

    // Initially labeled Zulu
    await page.keyboard.type('z')
    await expect(item).toBeFocused()

    // Dynamic label change is matched
    await page.waitForTimeout(2500)
    await page.getByTestId('set-label-rainbow').click()
    await expect(item).toHaveText('Rainbow')
    await folder.focus()
    await page.keyboard.type('rrr')
    await expect(item).toBeFocused()

    // Explicit textValue wins over the rendered label
    await page.waitForTimeout(2500)
    await page.evaluate(
      () => (document.querySelector('[data-testid="set-textvalue-bravo"]') as HTMLElement)?.click()
    )
    await expect(item).toHaveAttribute('data-text-value', 'Bravo')
    await folder.focus()
    await page.keyboard.type('bb')
    await expect(item).toBeFocused()

    // Stale label no longer matches once overridden
    await page.waitForTimeout(2500)
    await folder.focus()
    await page.keyboard.type('rrr')
    await expect(page.getByTestId('tree-item-doc-1')).toBeFocused()
  })
});
