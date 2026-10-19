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
  test('CB-ADAPTER-06: consumer handlers cancel cell preview and commit independently', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/PreventCellLog')
    const input = page.getByTestId('pc-input')
    await input.click()

    // Unprevented movement previews with the real child id.
    await page.getByTestId('pc-cell-move').hover()
    const moveId = await page.getByTestId('pc-cell-move').getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', moveId ?? '')
    expect(await logOf(page, 'pc-log')).toContain('move-handler')

    // Prevented movement leaves the previous active state untouched.
    await clickNoFocus(page, 'pc-arm-move')
    await page.getByTestId('pc-cell-click').hover()
    const clickId = await page.getByTestId('pc-cell-click').getAttribute('id')
    await expect(input).toHaveAttribute('aria-activedescendant', clickId ?? '')
    await page.getByTestId('pc-cell-move').hover()
    await expect(input).toHaveAttribute('aria-activedescendant', clickId ?? '')
    await expect(page.getByTestId('pc-cell-move')).not.toHaveAttribute('data-active', '')

    // Prevented activation commits nothing and stays open.
    await clickNoFocus(page, 'pc-arm-click')
    await page.getByTestId('pc-cell-click').click()
    const log = await logOf(page, 'pc-log')
    expect(log).toContain('click-handler')
    expect(log.some(entry => entry.startsWith('change:'))).toBe(false)
    await expect(input).toHaveAttribute('aria-expanded', 'true')

    // Unprevented activation commits exactly once.
    await clickNoFocus(page, 'pc-arm-click')
    await page.getByTestId('pc-cell-click').click()
    expect((await logOf(page, 'pc-log')).filter(entry => entry.startsWith('change:'))).toEqual([
      'change:click',
    ])
  })
});
