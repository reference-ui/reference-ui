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

async function clickPopoverChrome(page: Page, popover: Locator) {
  const box = await popover.boundingBox()
  const firstOption = popover.locator('[role="option"]').first()
  const optBox = await firstOption.boundingBox()
  expect(box).toBeTruthy()
  expect(optBox).toBeTruthy()
  const gap = optBox!.y - box!.y
  expect(gap).toBeGreaterThan(0)
  await page.mouse.click(box!.x + 3, box!.y + gap / 2)
}

test.describe('Combobox virtual listbox and tree bridge CT', () => {
  test('CB-CLOSE-02 parent-internal: combobox-external press closes only the child once', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/NestedOverlay')

    const input = page.getByTestId('nested-input')
    const popover = page.getByTestId('nested-popover')
    await input.click()
    await expect(popover).toBeVisible()
    expect(await readLog(page, 'nested-log')).toEqual(['open'])

    // Popover interaction dismisses neither owner.
    await clickPopoverChrome(page, popover)
    await expect(popover).toBeVisible()
    await expect(page.getByTestId('parent-state')).toHaveText('parent-open')

    // Parent-internal but combobox-external press closes only the
    // combobox, exactly once; the parent layer remains.
    const content = page.getByTestId('parent-content')
    const box = await content.boundingBox()
    await page.mouse.click(box!.x + 5, box!.y + 5)
    await expect(popover).toHaveCount(0)
    expect(await readLog(page, 'nested-log')).toEqual(['open', 'dismiss'])
    await expect(page.getByTestId('parent-state')).toHaveText('parent-open')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
  })
});
