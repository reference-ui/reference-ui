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
  test('TR-KEY-03: LTR Tree should request expansion on Right while keeping focus on a controlled collapsed branch', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    await page.getByTestId('set-expanded-none').click()
    const folder = page.getByTestId('tree-item-folder-1')
    await folder.focus()
    await expect(folder).toHaveAttribute('aria-expanded', 'false')

    await page.keyboard.press('ArrowRight')
    await expect(folder).toBeFocused()
    await expect(folder).toHaveAttribute('tabindex', '0')
    await expect(folder).toHaveAttribute('aria-expanded', 'true')
  })
});
