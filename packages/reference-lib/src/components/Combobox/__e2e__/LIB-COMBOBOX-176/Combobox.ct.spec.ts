/**
 * Combobox browser proofs: input open/commit flows plus the
 * reconciliation rows across DOM, open, edit, nav, commit, and close
 * areas. Mounts the story logs and asserts controlled relationships,
 * active-descendant discipline, and one-request commits in a real browser.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator, Page } from '@playwright/test'

async function readLog(page: Page, testid: string): Promise<string[]> {
  const text = await page.getByTestId(testid).textContent()
  return JSON.parse(text ?? '[]')
}

async function expectActiveDescendant(source: Locator, option: Locator) {
  const id = await option.getAttribute('id')
  expect(id).toBeTruthy()
  await expect(source).toHaveAttribute('aria-activedescendant', id!)
}

test.describe('Combobox virtual listbox and tree bridge CT', () => {
  test('CB-COMP-03 grid: palette composes a locked overlay with a grid popup', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/PaletteGridLog')

    const input = page.getByTestId('pg-input')
    const popover = page.getByTestId('pg-popover')
    await input.click()
    await expect(popover).toBeVisible()

    // One parent/child layer model; the grid role comes from the adapter.
    await expect(page.getByTestId('pg-layers')).toHaveText('2')
    await expect(input).toHaveAttribute('aria-haspopup', 'grid')
    await expect(popover).toHaveAttribute('role', 'grid')

    // Grid navigation, windowed scroll, and one scalar commit with the
    // input focused throughout.
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, page.getByTestId('pg-cell-cell-00'))
    await page.keyboard.press('PageDown')
    expect(await readLog(page, 'pg-log')).toContain('scroll:20')
    await expectActiveDescendant(input, page.getByTestId('pg-cell-cell-20'))
    await expect(input).toBeFocused()
    await page.keyboard.press('Enter')
    const log = await readLog(page, 'pg-log')
    expect(log).toContain('change:cell-20')
    expect(log.filter(entry => entry === 'dismiss')).toHaveLength(1)
    await expect(popover).toHaveCount(0)
    await expect(page.getByTestId('pg-parent-state')).toHaveText('parent-open')
    await expect(page.getByTestId('pg-layers')).toHaveText('1')

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('pg-parent-state')).toHaveText('parent-closed')
    await expect(page.getByTestId('pg-layers')).toHaveText('0')
  })
});
