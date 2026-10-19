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
  test('TR-EXPAND-05: Tree should never offer or request expansion for a leaf', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const readme = page.getByTestId('tree-item-readme')
    await readme.focus()
    await expect(readme).not.toHaveAttribute('aria-expanded')

    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowLeft')
    const expDisplay = page.getByTestId('tree-expanded-display')
    expect(await expDisplay.textContent()).not.toContain('file-readme')
  })
});
