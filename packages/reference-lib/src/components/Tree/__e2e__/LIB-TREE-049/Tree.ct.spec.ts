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
  test('TR-KEY-13: Tree asterisk key should never enter the typeahead buffer', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    await page.getByTestId('set-expanded-none').click()
    const folder = page.getByTestId('tree-item-folder-1')
    const readme = page.getByTestId('tree-item-readme')
    const charlie = page.getByTestId('tree-item-charlie')
    await readme.focus()

    // `*` on the readme leaf expands folder-1 without touching the buffer, so
    // the immediately following "ch" must match as a fresh query. Press all
    // three keys back-to-back so a buffer leak could not hide behind expiry.
    await page.keyboard.press('*')
    await page.keyboard.press('c')
    await page.keyboard.press('h')
    await expect(folder).toHaveAttribute('aria-expanded', 'true')
    await expect(charlie).toBeFocused()
  })
});
