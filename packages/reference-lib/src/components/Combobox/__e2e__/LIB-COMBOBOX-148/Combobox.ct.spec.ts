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
  test('CB-ADAPTER-03: multiple-selection listbox diagnoses and stays scalar', async ({
    mount,
    page,
  }) => {
    const errors = captureComboboxDiagnostics(page)
    await mount('components/Combobox/Combobox/MultipleLog')
    expect(errors.some(text => text.includes('commit contract is scalar'))).toBe(true)

    await page.getByTestId('ml-input').click()
    await expect(page.getByTestId('ml-popover').getByRole('listbox')).toHaveAttribute(
      'aria-multiselectable',
      'true'
    )
    await page.getByTestId('ml-opt-alpha').click()
    const log = await logOf(page, 'ml-log')
    expect(log.filter(entry => entry.startsWith('change:'))).toEqual(['change:"alpha"'])
    expect(log.join(' ')).not.toContain('[')
  })
});
