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

async function expectLogSoon(page: Page, testid: string, expected: string[]) {
  await expect.poll(async () => readLog(page, testid)).toEqual(expected)
}

async function expectActiveDescendant(source: Locator, option: Locator) {
  const id = await option.getAttribute('id')
  expect(id).toBeTruthy()
  await expect(source).toHaveAttribute('aria-activedescendant', id!)
}

test.describe('Combobox virtual listbox and tree bridge CT', () => {
  test('CB-TREE-01: tree popup navigates visible items and delegates expansion with input focused', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/TreeLog')

    const input = page.getByTestId('tb-input')
    await expect(input).toHaveAttribute('aria-haspopup', 'tree')
    await input.click()
    const popover = page.getByTestId('tb-popover')
    await expect(popover).toBeVisible()
    await expect(page.getByTestId('tb-tree')).toHaveAttribute('role', 'tree')

    // Vertical arrows visit mounted visible treeitems only: fruits,
    // apple, banana (expanded), then veg — never unmounted carrot —
    // then other, wrapping back to fruits.
    const order = ['fruits', 'apple', 'banana', 'veg', 'other', 'fruits']
    for (const value of order) {
      await page.keyboard.press('ArrowDown')
      await expectActiveDescendant(input, page.getByTestId(`tb-item-${value}`))
      await expect(input).toBeFocused()
    }
    expect(await readLog(page, 'tb-log')).toEqual(['open'])

    // Redundant expansion enters the first enabled child instead of
    // emitting: fruits is already expanded, so ArrowRight moves
    // virtual-active to apple with no onExpandedChange.
    await expect(page.getByTestId('tb-item-fruits')).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('ArrowRight')
    await expectActiveDescendant(input, page.getByTestId('tb-item-apple'))
    await expect(input).toBeFocused()
    // Negative emission assert: let a late effect write land first.
    await page.waitForTimeout(150)
    expect(await readLog(page, 'tb-log')).toEqual(['open'])

    // Collapsing the branch emits once, unmounts the children, and
    // navigation skips them.
    await page.keyboard.press('ArrowUp')
    await expectActiveDescendant(input, page.getByTestId('tb-item-fruits'))
    await page.keyboard.press('ArrowLeft')
    await expectLogSoon(page, 'tb-log', ['open', 'expanded:'])
    await expect(page.getByTestId('tb-item-fruits')).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByTestId('tb-item-apple')).toHaveCount(0)
    await expect(page.getByTestId('tb-item-banana')).toHaveCount(0)
    await expectActiveDescendant(input, page.getByTestId('tb-item-fruits'))
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, page.getByTestId('tb-item-veg'))

    // Re-expand, then type mid-text so the caret sits mid-field:
    // typing re-actives the first visible item.
    await page.keyboard.press('ArrowUp')
    await expectActiveDescendant(input, page.getByTestId('tb-item-fruits'))
    await page.keyboard.press('ArrowRight')
    await expectLogSoon(page, 'tb-log', ['open', 'expanded:', 'expanded:fruits'])
    await expect(page.getByTestId('tb-item-apple')).toBeVisible()
    await page.keyboard.type('xy')
    await expectActiveDescendant(input, page.getByTestId('tb-item-fruits'))
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, page.getByTestId('tb-item-apple'))

    // Leaves swallow horizontal keys in both directions: no request,
    // and a mid-field caret does not move (native keys would move it).
    await input.evaluate(el => (el as HTMLInputElement).setSelectionRange(1, 1))
    const logBefore = await readLog(page, 'tb-log')
    await page.keyboard.press('ArrowLeft')
    // Negative request assert: let a late effect write land first.
    await page.waitForTimeout(150)
    expect(await readLog(page, 'tb-log')).toEqual(logBefore)
    expect(await input.evaluate(el => (el as HTMLInputElement).selectionStart)).toBe(1)
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(150)
    expect(await readLog(page, 'tb-log')).toEqual(logBefore)
    expect(await input.evaluate(el => (el as HTMLInputElement).selectionStart)).toBe(1)
    await expect(input).toBeFocused()

    // Item activation commits one scalar through root onChange only;
    // the nested Tree carries no callback at all.
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, page.getByTestId('tb-item-banana'))
    await page.keyboard.press('Enter')
    const log = await readLog(page, 'tb-log')
    expect(log).toContain('change:banana')
    expect(log.filter(entry => entry.startsWith('tree:'))).toEqual([])
    expect(log.filter(entry => entry === 'dismiss')).toHaveLength(1)
    await expect(popover).toHaveCount(0)
  })
});
