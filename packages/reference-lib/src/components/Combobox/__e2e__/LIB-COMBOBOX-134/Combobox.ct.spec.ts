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
  test('CB-MODE-04: both tracks completion across options and restores the prefix', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/BothLog')
    const input = page.getByTestId('log-input')
    await input.focus()
    await input.pressSequentially('Al')
    await expect(input).toHaveValue('Alpha')
    expect(await inputState(input)).toEqual({ value: 'Alpha', start: 2, end: 5 })
    const typedLog = await logOf(page, 'log-counts')

    // Pointer preview of a non-matching label drops the completion; leave restores.
    await page.getByTestId('log-opt-bravo').hover()
    expect((await inputState(input)).value).toBe('Al')
    await page.getByTestId('log-popover').hover()
    await page.mouse.move(4, 4)
    expect(await inputState(input)).toEqual({ value: 'Al', start: 2, end: 2 })
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)
    expect(await logOf(page, 'log-counts')).toEqual(typedLog)
  })
});
