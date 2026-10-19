/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

test.describe('Combobox reconciliation CT', () => {
  test('CB-CLOSE-02: popover registers as an overlay branch inside a parent overlay', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/NestedOverlay')

    await expect(page.getByTestId('parent-content')).toBeVisible()
    const input = page.getByTestId('nested-input')
    await input.click()
    await expect(page.getByTestId('nested-popover')).toBeVisible()

    await page.getByTestId('nested-opt-bravo').click()
    await expect(page.getByTestId('nested-value-display')).toHaveText('Selected: bravo')
    await expect(page.getByTestId('parent-state')).toHaveText('parent-open')
    await expect(page.getByTestId('parent-content')).toBeVisible()
  })
});
