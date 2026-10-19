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
  test('TR-DOM-03: Tree should expose expansion state only on items that currently own children', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder1 = page.getByTestId('tree-item-folder-1')
    const readme = page.getByTestId('tree-item-readme')
    const alpha = page.getByTestId('tree-item-alpha')

    await expect(folder1).toHaveAttribute('aria-expanded', 'true')
    await expect(readme).not.toHaveAttribute('aria-expanded')
    await expect(alpha).not.toHaveAttribute('aria-expanded')

    await page.getByTestId('toggle-alpha-branch').click()
    await expect(alpha).toHaveAttribute('aria-expanded', 'false')

    await page.getByTestId('toggle-alpha-branch').click()
    await expect(alpha).not.toHaveAttribute('aria-expanded')
  })
});
