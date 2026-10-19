/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

test.describe('Combobox cluster B CT', () => {
  test('CB-DOM-03: trigger keeps button semantics while exposing popup state', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SelectOnlyStory')
    const trigger = page.getByTestId('select-trigger')
    await expect(trigger).toHaveAttribute('role', 'combobox')
    await expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await mount('components/Combobox/Combobox/TreeTriggerLog')
    const treeTrigger = page.getByTestId('tt-trigger')
    await expect(treeTrigger).toHaveAttribute('aria-haspopup', 'tree')
    await treeTrigger.click()
    await expect(treeTrigger).toHaveAttribute('aria-expanded', 'true')

    await mount('components/Combobox/Combobox/GridSelectOnly')
    const gridTrigger = page.getByTestId('gs-trigger')
    await expect(gridTrigger).toHaveAttribute('aria-haspopup', 'grid')
    await gridTrigger.click()
    await expect(gridTrigger).toHaveAttribute('aria-expanded', 'true')
  })
});
