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
  test('TR-DOM-11: Tree Expander should be a named non-tab-stop button linked to its branch Group', async ({
    mount,
    page,
  }) => {
    await mount('components/Tree/Tree/Parity')
    await expect(page.getByTestId('tree-fixture-root')).toBeVisible()

    const folder1 = page.getByTestId('tree-item-folder-1')
    const expander = page.getByTestId('expander-folder-1')
    const group = page.getByTestId('tree-group-folder-1')

    await expect(expander).toHaveAttribute('type', 'button')
    await expect(expander).toHaveAttribute('tabindex', '-1')
    await expect(expander).toHaveAttribute('aria-label', 'Toggle Documents')

    const controlsId = await expander.getAttribute('aria-controls')
    const groupId = await group.getAttribute('id')
    expect(controlsId).toBeTruthy()
    expect(controlsId).toBe(groupId)

    await folder1.focus()
    await expect(folder1).toBeFocused()
  })
});
