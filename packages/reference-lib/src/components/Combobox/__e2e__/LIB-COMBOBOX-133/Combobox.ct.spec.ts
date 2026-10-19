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
  test('CB-MODE-03: both completes the suffix; typing replaces only the suffix', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/BothLog')
    const input = page.getByTestId('log-input')
    await expect(input).toHaveAttribute('aria-autocomplete', 'both')

    await input.focus()
    await input.pressSequentially('Al')
    await expect(input).toHaveValue('Alpha')
    expect(await inputState(input)).toEqual({ value: 'Alpha', start: 2, end: 5 })

    await input.press('p')
    expect(await logOf(page, 'log-counts')).toEqual(['input:A', 'open', 'input:Al', 'input:Alp'])
    await expect(input).toHaveValue('Alpha')
  })
});
