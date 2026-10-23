/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

async function logOf(page: Page, testid: string): Promise<string[]> {
  return JSON.parse((await page.getByTestId(testid).textContent()) ?? '[]')
}

test.describe('Combobox cluster B CT', () => {
  test('CB-ADAPTER-04: VirtualItem slots stable state onto one native child', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SlottedCellLog')
    const input = page.getByTestId('slot-input')
    await expect(page.getByTestId('slot-cell-solo')).toHaveCount(0)

    await input.click()
    const solo = page.getByTestId('slot-cell-solo')
    await expect(solo).toBeVisible()
    const soloId = await solo.getAttribute('id')
    expect(soloId).toContain('solo')
    await expect(solo).toHaveClass(/cell-base/)
    await expect(solo).toHaveClass(/virt-extra/)
    expect(await solo.evaluate(el => getComputedStyle(el).opacity)).toBe('0.5')
    expect(await solo.evaluate(el => getComputedStyle(el).color)).toBe('rgb(1, 2, 3)')
    expect(await logOf(page, 'slot-log')).toContain('ref-solo')

    // Hover previews with the real child id; rerenders keep it stable.
    await solo.hover()
    await expect(input).toHaveAttribute('aria-activedescendant', soloId ?? '')
    await expect(solo).toHaveAttribute('data-active', '')
    await page.getByTestId('slot-cell-duo').hover()
    await solo.hover()
    expect(await solo.getAttribute('id')).toBe(soloId)

    // Child click runs before the root commit.
    await solo.click()
    const log = await logOf(page, 'slot-log')
    expect(log.indexOf('cell-click')).toBeLessThan(log.indexOf('change:solo'))

    // Committed selection publishes selected state on reopen.
    await input.click()
    await expect(solo).toHaveAttribute('aria-selected', 'true')
    await expect(solo).toHaveAttribute('data-selected', '')
  })
});
