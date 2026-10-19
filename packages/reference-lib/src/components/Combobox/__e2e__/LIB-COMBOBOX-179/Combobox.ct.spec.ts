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
  test('CB-COMP-02 list-mode reject: ignored text requests leave no hidden state', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/CaretRejectLog')

    const input = page.getByTestId('cr-input')
    const popover = page.getByTestId('cr-popover')
    await input.click()
    await expect(popover).toBeVisible()

    // The parent ignores every text request: the DOM restores, one
    // request per keystroke, no commit, no hidden divergence.
    await page.keyboard.type('x')
    expect(await readLog(page, 'cr-log')).toEqual(['open', 'input:Alphax'])
    await expect(input).toHaveValue('Alpha')
    await expect(input).toBeFocused()

    // Escape reverts to the committed (null) label and dismisses
    // atomically; the ignored restore request leaves the DOM untouched.
    // A second Escape on the closed source is inert. Reopening restores
    // nothing phantom.
    await page.keyboard.press('Escape')
    await expect(popover).toHaveCount(0)
    await page.keyboard.press('Escape')
    expect(await readLog(page, 'cr-log')).toEqual(['open', 'input:Alphax', 'input:', 'dismiss'])
    await expect(input).toHaveValue('Alpha')
    await input.click()
    await expect(popover).toBeVisible()
    await expect(input).toHaveValue('Alpha')
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, page.getByTestId('cr-opt-alpha'))
  })
});
