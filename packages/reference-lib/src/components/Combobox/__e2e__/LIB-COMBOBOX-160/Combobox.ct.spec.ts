/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

test.describe('Combobox text restore, dialog blur, and custom value CT', () => {
  test('tabbing into the input never opens the popup', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/TabOrder')
    const input = page.getByTestId('tab-input')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await page.getByTestId('tab-before').focus()
    await page.keyboard.press('Tab')
    await expect(input).toBeFocused()
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('tab-popover')).toHaveCount(0)
  })
});
