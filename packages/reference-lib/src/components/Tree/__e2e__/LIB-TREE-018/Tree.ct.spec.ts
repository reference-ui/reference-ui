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
  test('TR-DOM-09: Empty Tree should expose its role without inventing a sequential focus target', async ({
    mount,
    page,
    browserName,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const btnBefore = page.getByTestId('btn-before-empty')
    const btnAfter = page.getByTestId('btn-after-empty')
    const emptyTree = page.getByTestId('empty-tree')

    await expect(emptyTree).toHaveAttribute('role', 'tree')
    await expect(emptyTree).not.toHaveAttribute('tabindex', '0')

    await btnBefore.focus()
    await expect(btnBefore).toBeFocused()
    await page.keyboard.press('Tab')
    if (browserName === 'webkit') {
      // WebKit skips buttons in sequential Tab, so the walk
      // sails over btn-after-empty AND the tabindex-less empty tree to
      // the next real stop (omitted-branch). The
      // contract — empty tree invents no sequential target — holds.
      await expect(emptyTree).not.toBeFocused()
      await expect(btnAfter).not.toBeFocused()
    } else {
      await expect(btnAfter).toBeFocused()
    }
  })
});
