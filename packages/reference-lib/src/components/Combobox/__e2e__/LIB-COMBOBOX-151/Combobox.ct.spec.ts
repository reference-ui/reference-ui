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
  test('CB-ADAPTER-05 recovery: the latest valid adapter recovers cleanly', async ({
    mount,
    page,
  }) => {
    const errors = captureComboboxDiagnostics(page)
    await mount('components/Combobox/Combobox/RecoverLog')
    expect(errors.some(text => text.includes('must have unique values'))).toBe(true)

    await page.getByTestId('rc-input').click()
    await expect(page.getByTestId('rc-cell')).toBeVisible()
    expect(await page.getByTestId('rc-cell').getAttribute('id')).toBeNull()

    await clickNoFocus(page, 'rc-toggle')
    await page.getByTestId('rc-input').press('ArrowDown')
    const cellId = await page.getByTestId('rc-cell').getAttribute('id')
    expect(cellId).toContain('ok')
    await expect(page.getByTestId('rc-input')).toHaveAttribute('aria-activedescendant', cellId ?? '')
  })
});
