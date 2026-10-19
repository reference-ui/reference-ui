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
  test('CB-CLOSE-04: controlled close clears semantics at commit and unmounts after the exit', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/ExitTimingLog')

    const input = page.getByTestId('ex-input')
    const popover = page.getByTestId('ex-popover')
    await page.getByTestId('ex-open').click()
    await expect(popover).toBeVisible()
    await expect(page.getByTestId('ex-layers')).toHaveText('1')
    await input.focus()
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, page.getByTestId('ex-opt-alpha'))

    // Programmatic close: open/active semantics clear at commit while the
    // exiting popover stays mounted, closed, and out of the layer.
    // Synthetic activation: a real pointer press would dismiss through
    // the outside path instead of the programmatic prop change.
    await page.getByTestId('ex-close').evaluate((el: HTMLElement) => el.click())
    await expect(popover).toHaveAttribute('data-state', 'closed')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(input).not.toHaveAttribute('aria-activedescendant', /.+/)
    await expect(popover).toHaveCount(1)
    await expect(page.getByTestId('ex-layers')).toHaveText('0')

    // The popover unmounts on its own exit with no extra dismissal.
    await expect(popover).toHaveCount(0)
    expect(await readLog(page, 'ex-log')).toEqual(['close-click'])

    // Exit-kept content is inert: pressing an option during a second
    // exit commits nothing and dismisses nothing further.
    await page.getByTestId('ex-open').click()
    await expect(popover).toBeVisible()
    // Synthetic activation: a real pointer press would dismiss through
    // the outside path instead of the programmatic prop change.
    await page.getByTestId('ex-close').evaluate((el: HTMLElement) => el.click())
    await expect(popover).toHaveAttribute('data-state', 'closed')
    await page.getByTestId('ex-opt-bravo').click()
    expect(await readLog(page, 'ex-log')).toEqual(['close-click', 'close-click'])
    await expect(popover).toHaveCount(0)
  })
});
