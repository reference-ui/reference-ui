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
  test('CB-MODE-02: list opens on edits and leaves typed text unchanged during navigation', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ControlledLog')
    const input = page.getByTestId('log-input')
    await expect(input).toHaveAttribute('aria-autocomplete', 'list')

    await input.focus()
    await input.pressSequentially('al')
    expect(await logOf(page, 'log-counts')).toEqual(['input:a', 'open', 'input:al'])
    await expect(page.getByTestId('log-popover')).toBeVisible()

    await input.press('ArrowDown')
    await input.press('ArrowDown')
    expect((await inputState(input)).value).toBe('al')
    expect(await logOf(page, 'log-counts')).toEqual(['input:a', 'open', 'input:al'])
  })
});
