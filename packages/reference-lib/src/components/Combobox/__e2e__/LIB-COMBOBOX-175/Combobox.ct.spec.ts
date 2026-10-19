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
  test('CB-COMP-03 tree: palette composes a locked overlay with a tree popup', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/PaletteTreeLog')

    const input = page.getByTestId('pt-input')
    const popover = page.getByTestId('pt-popover')
    await expect(page.getByTestId('pt-parent-state')).toHaveText('parent-open')
    await input.click()
    await expect(popover).toBeVisible()

    // One parent/child layer model; collection-authored roles.
    await expect(page.getByTestId('pt-layers')).toHaveText('2')
    await expect(input).toHaveAttribute('aria-haspopup', 'tree')
    await expect(page.getByTestId('pt-tree')).toHaveAttribute('role', 'tree')
    await expect(popover).toHaveAttribute('role', 'presentation')

    // Popover interaction dismisses neither owner (tree-aware chrome
    // click: the gap above the first treeitem).
    const popBox = await popover.boundingBox()
    const firstItem = popover.locator('[role="treeitem"]').first()
    const itemBox = await firstItem.boundingBox()
    expect(popBox).toBeTruthy()
    expect(itemBox).toBeTruthy()
    const chromeGap = itemBox!.y - popBox!.y
    expect(chromeGap).toBeGreaterThan(0)
    await page.mouse.click(popBox!.x + 4, popBox!.y + chromeGap / 2)
    await expect(popover).toBeVisible()
    await expect(page.getByTestId('pt-parent-state')).toHaveText('parent-open')
    expect(await readLog(page, 'pt-log')).toEqual(['open'])

    // Parent-internal but popover-external press closes only the child, once.
    const card = page.getByTestId('pt-card')
    const cardBox = await card.boundingBox()
    await page.mouse.click(cardBox!.x + 8, cardBox!.y + 8)
    await expect(popover).toHaveCount(0)
    expect(await readLog(page, 'pt-log')).toEqual(['open', 'dismiss'])
    await expect(page.getByTestId('pt-parent-state')).toHaveText('parent-open')
    await expect(page.getByTestId('pt-layers')).toHaveText('1')

    // Reopen and navigate to the collapsed branch, expand it, reach the
    // revealed leaf.
    await input.click()
    await expect(popover).toBeVisible()
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowDown')
    }
    await expectActiveDescendant(input, page.getByTestId('pt-item-veg'))
    await page.keyboard.press('ArrowRight')
    await expectLogSoon(page, 'pt-log', ['open', 'dismiss', 'open', 'expanded:fruits+veg'])
    await expect(input).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expectActiveDescendant(input, page.getByTestId('pt-item-carrot'))

    // One scalar Combobox commit; the nested Tree carries no callback at all.
    await page.keyboard.press('Enter')
    const log = await readLog(page, 'pt-log')
    expect(log).toContain('change:carrot')
    expect(log.filter(entry => entry.startsWith('tree:'))).toEqual([])
    expect(log.filter(entry => entry === 'dismiss')).toHaveLength(2)
    await expect(popover).toHaveCount(0)
    await expect(page.getByTestId('pt-parent-state')).toHaveText('parent-open')
    await expect(page.getByTestId('pt-layers')).toHaveText('1')

    // Dismissing across the branch closes the parent last, exactly once.
    // (Dialog-shape modals take explicit dismissal; Escape reaches the
    // top parent layer deterministically.)
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('pt-parent-state')).toHaveText('parent-closed')
    await expect(page.getByTestId('pt-layers')).toHaveText('0')
  })
});
