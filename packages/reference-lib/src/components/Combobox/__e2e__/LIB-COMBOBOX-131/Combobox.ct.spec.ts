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
  test('CB-MODE-01: none navigates suggestions without changing input text', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/NoneLog')
    const input = page.getByTestId('log-input')
    await expect(input).toHaveAttribute('aria-autocomplete', 'none')

    await input.focus()
    await input.pressSequentially('Al')
    expect(await logOf(page, 'log-counts')).toEqual(['input:A', 'open', 'input:Al'])

    await input.press('ArrowDown')
    const bravoId = await page.getByTestId('log-opt-bravo').getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', bravoId ?? '')
    await input.press('ArrowDown')
    const charlieId = await page.getByTestId('log-opt-charlie').getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', charlieId ?? '')
    expect((await inputState(input)).value).toBe('Al')
    expect(await logOf(page, 'log-counts')).toEqual(['input:A', 'open', 'input:Al'])
  })
});
