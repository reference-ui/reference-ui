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
  test('CB-EDIT-04 self-scroll: the input scrolling preserves the open popover', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/SelfScrollLog')

    const input = page.getByTestId('ss-input')
    const popover = page.getByTestId('ss-popover')
    await input.click()
    await expect(popover).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, page.getByTestId('ss-opt-alpha'))
    const logBefore = await readLog(page, 'ss-log')

    // The input's own scroll (not an ancestor's) changes scrollLeft and
    // fires scroll without touching popover, focus, active ID, or log.
    const scrolled = await input.evaluate(el => {
      const target = el as HTMLInputElement
      const before = target.scrollLeft
      target.scrollLeft = 200
      target.dispatchEvent(new Event('scroll', { bubbles: false }))
      return { before, after: target.scrollLeft }
    })
    expect(scrolled.after).toBeGreaterThan(scrolled.before)
    await expect(popover).toBeVisible()
    await expect(input).toBeFocused()
    await expectActiveDescendant(input, page.getByTestId('ss-opt-alpha'))
    expect(await readLog(page, 'ss-log')).toEqual(logBefore)
  })
});
