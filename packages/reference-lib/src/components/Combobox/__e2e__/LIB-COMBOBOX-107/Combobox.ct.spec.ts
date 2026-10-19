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

test.describe('Combobox reconciliation CT', () => {
  test('CB-EDIT-04 ancestor scroll: scrolling the page dismisses the open popover', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ScrollPage')

    const input = page.getByTestId('scroll-input')
    await input.click()
    await expect(page.getByTestId('scroll-popover')).toBeVisible()
    await page.keyboard.type('a')
    await expectActiveDescendant(input, page.getByTestId('scroll-opt-alpha'))
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, page.getByTestId('scroll-opt-bravo'))

    // Ancestor scroll dismisses with exactly one granular-before-high-level
    // sequence and no text revert: unlike blur/outside press, the editing
    // session continues (focus stays, typed text is preserved).
    await page.evaluate(() => window.scrollBy(0, 400))
    await expect(page.getByTestId('scroll-popover')).toHaveCount(0)
    expect(await readLog(page, 'scroll-log')).toEqual([
      'open',
      'openChange:true',
      'input:a',
      'openChange:false',
      'dismiss',
    ])
    await expect(input).toBeFocused()
    await expect(input).toHaveValue('a')
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)
  })
});
