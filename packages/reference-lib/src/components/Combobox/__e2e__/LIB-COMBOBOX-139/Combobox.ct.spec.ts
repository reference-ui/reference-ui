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
  test('CB-OPEN-03 populated: one edit requests one open with content', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ControlledLog')
    const input = page.getByTestId('log-input')
    await input.focus()
    await input.pressSequentially('a')
    expect(await logOf(page, 'log-counts')).toEqual(['input:a', 'open'])
    await input.pressSequentially('b')
    expect(await logOf(page, 'log-counts')).toEqual(['input:a', 'open', 'input:ab'])
  })
});
