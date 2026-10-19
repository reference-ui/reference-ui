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
  test('CB-ADAPTER-02 invalid: nested onChange diagnoses and never double-updates', async ({
    mount,
    page,
  }) => {
    const errors = captureComboboxDiagnostics(page)
    await mount('components/Combobox/Combobox/NestedChangeLog')
    await expect(page.getByTestId('nc-fallback')).toContainText('cannot have an onChange')
    expect(errors.some(text => text.includes('must not carry its own onChange'))).toBe(true)
    expect(await logOf(page, 'nc-log')).toEqual([])
  })
});
