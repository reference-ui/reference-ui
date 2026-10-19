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
  test('TR-KEY-10: Tree should preserve keyboard ownership for editable and interactive item descendants', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const input = page.getByTestId('item-nested-input')
    await input.focus()
    await input.fill('hello')
    await expect(input).toHaveValue('hello')

    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowRight')
    await expect(input).toBeFocused()

    const display = page.getByTestId('tree-value-display')
    const button = page.getByTestId('item-nested-button')
    await button.focus()
    await page.keyboard.press(' ')
    await expect(button).toBeFocused()
    await expect(display).toHaveText('Selected: doc-1')
    await page.keyboard.press('Enter')
    await expect(button).toBeFocused()
    await expect(display).toHaveText('Selected: doc-1')
  })
});
