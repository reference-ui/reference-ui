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

async function expectActiveDescendant(source: Locator, option: Locator) {
  const id = await option.getAttribute('id')
  expect(id).toBeTruthy()
  await expect(source).toHaveAttribute('aria-activedescendant', id!)
}

test.describe('Combobox cluster B CT', () => {
  test('Tree popup bridge: native registration navigates TreeItems and commits through root onChange (#6)', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/TreePopupLog')
    const input = page.getByTestId('tp-input')
    await expect(input).toHaveAttribute('aria-haspopup', 'tree')
    await input.click()
    await expect(page.getByTestId('tp-tree')).toBeVisible()
    await input.press('ArrowDown')
    await expectActiveDescendant(input, page.getByTestId('tp-item-leaf-a'))
    await expect(input).toBeFocused()
    await input.press('ArrowDown')
    await expectActiveDescendant(input, page.getByTestId('tp-item-leaf-b'))
    await input.press('Enter')
    expect(await logOf(page, 'tp-log')).toEqual(['open', 'change:leaf-b', 'dismiss'])
    await expect(page.getByTestId('tp-popover')).toHaveCount(0)
  })
});
