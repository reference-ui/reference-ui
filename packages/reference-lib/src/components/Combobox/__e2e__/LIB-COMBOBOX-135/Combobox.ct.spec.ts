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
  test('CB-MODE-05: backspace and delete edit inline completion natively without committing', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/BothLog')
    const input = page.getByTestId('log-input')
    const counts = page.getByTestId('log-counts')
    await input.focus()

    // Backspace half from a waited completion (fill is one commit).
    await input.fill('Al')
    await expect(input).toHaveValue('Alpha')
    expect(await inputState(input)).toEqual({ value: 'Alpha', start: 2, end: 5 })
    await input.press('Backspace')
    await expect(counts).toContainText('input:Al')
    expect(await logOf(page, 'log-counts')).not.toContain('dismiss')
    await expect(input).toHaveAttribute('aria-expanded', 'true')

    // Delete half from a fresh waited completion; caret proof first.
    await input.fill('Al')
    await expect(input).toHaveValue('Alpha')
    await input.press('ArrowLeft')
    expect(await inputState(input)).toEqual({ value: 'Alpha', start: 2, end: 2 })
    await input.press('Delete')
    await expect(counts).toContainText('input:Alha')
    const log = await logOf(page, 'log-counts')
    expect(log.some(entry => entry.startsWith('change:'))).toBe(false)
    await expect(input).toHaveAttribute('aria-expanded', 'true')
  })
});
