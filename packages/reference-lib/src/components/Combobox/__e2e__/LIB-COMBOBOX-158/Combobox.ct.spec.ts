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
  test('escape restores committed text over stale input', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SelectedLog')
    const input = page.getByTestId('log-input')
    await input.click()
    await expect(page.getByTestId('log-opt-bravo')).toBeVisible()
    await page.keyboard.type('zzz')
    await expect(input).toHaveValue('Bravozzz')

    await page.keyboard.press('Escape')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(input).toHaveValue('Bravo')
  })
});
