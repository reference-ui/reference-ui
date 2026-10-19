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
  test('TR-TYPE-03: Tree typeahead should use the current visible set when expansion changes mid-buffer', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder = page.getByTestId('tree-item-folder-1')
    await folder.focus()

    await page.keyboard.type('a')
    await expect(page.getByTestId('tree-item-subfolder-1')).toBeFocused()

    // Collapse mid-buffer through a fast path, then continue typing at once.
    // Buffer 'ar' would match Archive if it were still mounted; a fresh 'r'
    // would match README instead. Staying put proves survival + ineligibility.
    await page.evaluate(
      () => (document.querySelector('[data-testid="expander-folder-1"]') as HTMLElement)?.click()
    )
    await page.keyboard.type('r')
    await expect(folder).toBeFocused()
    await expect(page.getByTestId('tree-item-subfolder-1')).toHaveCount(0)

    // Fresh buffer still skips the hidden Archive
    await page.waitForTimeout(2500)
    await folder.focus()
    await page.keyboard.type('a')
    await expect(page.getByTestId('tree-item-alpha')).toBeFocused()

    // Newly visible matches are immediately eligible
    await page.waitForTimeout(2500)
    await page.evaluate(
      () => (document.querySelector('[data-testid="set-expanded-multi"]') as HTMLElement)?.click()
    )
    await expect(page.getByTestId('tree-item-subfolder-1')).toBeVisible()
    await folder.focus()
    await page.keyboard.type('a')
    await expect(page.getByTestId('tree-item-subfolder-1')).toBeFocused()
  })
});
