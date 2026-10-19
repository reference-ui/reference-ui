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
  test('TR-KEY-12: Tree asterisk key should expand per APG across closed branch, open branch, and leaf', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder = page.getByTestId('tree-item-folder-1')
    const disabledBranch = page.getByTestId('tree-item-disabled-branch')
    const cancelBranch = page.getByTestId('tree-item-cancel-expand')
    const pathBranch = page.getByTestId('tree-item-path-branch')
    const readme = page.getByTestId('tree-item-readme')
    const expansionLog = page.getByTestId('tree-expansion-log')

    // Case 1: closed branch expands itself; focus stays put.
    await disabledBranch.focus()
    await expect(disabledBranch).toHaveAttribute('aria-expanded', 'false')
    await page.keyboard.press('*')
    await expect(disabledBranch).toHaveAttribute('aria-expanded', 'true')
    await expect(disabledBranch).toBeFocused()

    // Case 2: open branch expands every closed sibling branch in ONE emission.
    await folder.focus()
    await expect(folder).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('*')
    await expect(cancelBranch).toHaveAttribute('aria-expanded', 'true')
    await expect(pathBranch).toHaveAttribute('aria-expanded', 'true')
    await expect(folder).toBeFocused()
    await expect(expansionLog).toHaveText(
      'ExpansionLog: folder-1+disabled-branch|folder-1+disabled-branch+cancel-expand-branch+src/index'
    )

    // Case 3: leaf expands the first closed sibling branch; focus stays put.
    await page.getByTestId('set-expanded-none').click()
    await readme.focus()
    await page.keyboard.press('*')
    await expect(folder).toHaveAttribute('aria-expanded', 'true')
    await expect(disabledBranch).toHaveAttribute('aria-expanded', 'false')
    await expect(readme).toBeFocused()

    // RTL: asterisk is direction-independent — identical behavior under dir=rtl.
    await page.getByTestId('toggle-rtl').click()
    await page.getByTestId('set-expanded-none').click()
    await expect(folder).toHaveAttribute('aria-expanded', 'false')
    await folder.focus()
    await page.keyboard.press('*')
    await expect(folder).toHaveAttribute('aria-expanded', 'true')
    await expect(folder).toBeFocused()
    await page.keyboard.press('*')
    await expect(disabledBranch).toHaveAttribute('aria-expanded', 'true')
    await expect(cancelBranch).toHaveAttribute('aria-expanded', 'true')
    await expect(pathBranch).toHaveAttribute('aria-expanded', 'true')
    await expect(folder).toBeFocused()
  })
});
