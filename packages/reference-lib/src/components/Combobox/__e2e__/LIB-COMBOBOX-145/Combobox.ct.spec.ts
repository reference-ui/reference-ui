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
  test('CB-ADAPTER-01: grid adapter navigates, scrolls, and commits one scalar', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/GridLog')
    const input = page.getByTestId('grid-input')
    await input.click()
    await expect(page.getByTestId('grid-popover')).toHaveAttribute('role', 'grid')
    expect(await page.getByRole('gridcell').count()).toBe(20)
    expect(await page.getByRole('row').count()).toBe(2)

    // Mounted navigation publishes real IDs with no scroll.
    await input.press('ArrowDown')
    const firstId = await page.getByTestId('grid-cell-cell-00').getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', firstId ?? '')
    await expect(page.getByTestId('grid-cell-cell-00')).toHaveAttribute('data-active', '')
    expect(await logOf(page, 'grid-log')).toEqual(['open'])

    // Unmounted target: one scroll, no ID until the cell mounts.
    await input.press('ArrowDown')
    await input.press('ArrowDown')
    expect(await logOf(page, 'grid-log')).toContain('scroll:20')
    await expect(page.getByTestId('grid-cell-cell-20')).toBeVisible()
    const pendingId = await page.getByTestId('grid-cell-cell-20').getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', pendingId ?? '')

    // One scalar commit through the root, then dismissal.
    await page.getByTestId('grid-cell-cell-01').click()
    const log = await logOf(page, 'grid-log')
    expect(log.filter(entry => entry.startsWith('change:'))).toEqual(['change:cell-01'])
    expect(log[log.length - 1]).toBe('dismiss')
    expect(await page.getByTestId('grid-popover').count()).toBe(0)
  })
});
