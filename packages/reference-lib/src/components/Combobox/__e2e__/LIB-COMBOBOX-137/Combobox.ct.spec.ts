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
  test('CB-MODE-07: completion navigation emits no text or value callbacks', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/BothLog')
    const input = page.getByTestId('log-input')
    await input.focus()
    await input.pressSequentially('Al')
    const before = await page.getByTestId('log-counts').textContent()

    await input.press('ArrowDown')
    await input.press('ArrowDown')
    await input.press('ArrowDown')
    expect(await page.getByTestId('log-counts').textContent()).toBe(before)
    await expect(input).toHaveAttribute('aria-expanded', 'true')
  })
});
