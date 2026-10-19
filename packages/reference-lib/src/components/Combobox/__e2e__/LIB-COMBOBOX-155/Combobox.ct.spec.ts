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
  test('CB-SELECT-08 virtual: trigger home/end/page wait behind one current scroll', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/GridSelectOnly')
    const trigger = page.getByTestId('gs-trigger')
    await trigger.click()

    await trigger.press('Home')
    const firstId = await page.getByTestId('gs-cell-cell-00').getAttribute('id')
    await expect(trigger).toHaveAttribute('aria-activedescendant', firstId ?? '')

    await trigger.press('PageDown')
    expect(await logOf(page, 'gs-log')).toContain('scroll:20')
    await expect(page.getByTestId('gs-cell-cell-20')).toBeVisible()
    const pageId = await page.getByTestId('gs-cell-cell-20').getAttribute('id')
    await expect(trigger).toHaveAttribute('aria-activedescendant', pageId ?? '')

    await trigger.press('End')
    expect(await logOf(page, 'gs-log')).toContain('scroll:99')
    await expect(page.getByTestId('gs-cell-cell-99')).toBeVisible()
    const lastId = await page.getByTestId('gs-cell-cell-99').getAttribute('id')
    await expect(trigger).toHaveAttribute('aria-activedescendant', lastId ?? '')
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe(
      'gs-trigger'
    )
  })
});
