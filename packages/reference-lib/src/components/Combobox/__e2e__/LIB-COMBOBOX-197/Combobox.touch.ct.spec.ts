/**
 * Combobox touch proofs: outside-touch dismissal without compat-mouse
 * replay, inside-tap tolerance, and single tap commits. Mounts the story
 * fixtures with touch enabled in a real browser.
 */
import { test, expect } from '../../../../../playwright/ct'
import type { Locator, Page } from '@playwright/test'

async function touchTap(page: Page, target: Locator) {
  const box = await target.boundingBox()
  if (!box) throw new Error('touch target has no bounding box')
  const x = Math.round(box.x + box.width / 2)
  const y = Math.round(box.y + box.height / 2)
  const session = await page.context().newCDPSession(page)
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y }],
  })
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

async function touchTapAt(page: Page, x: number, y: number) {
  const session = await page.context().newCDPSession(page)
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: Math.round(x), y: Math.round(y) }],
  })
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

async function logOf(page: Page, testid: string): Promise<string[]> {
  return JSON.parse((await page.getByTestId(testid).textContent()) ?? '[]')
}

test.describe('Combobox touch outside-dismiss CT', () => {
  test('CB-CLOSE-05 inside: touches on the source, chrome, and options stay inside', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/TouchLog')
    const input = page.getByTestId('tc-input')
    await input.click()
    await page.getByTestId('tc-clear').evaluate((el: HTMLElement) => el.click())

    await touchTap(page, input)
    await expect(input).toHaveAttribute('aria-expanded', 'true')

    // Popover padding chrome (top-left corner, away from options).
    const popoverBox = await page.getByTestId('tc-popover').boundingBox()
    if (!popoverBox) throw new Error('popover has no bounding box')
    await touchTapAt(page, popoverBox.x + 3, popoverBox.y + 3)
    await expect(input).toHaveAttribute('aria-expanded', 'true')

    expect(await logOf(page, 'tc-log')).toEqual([])
    await page.waitForTimeout(500)
    expect(await logOf(page, 'tc-log')).toEqual([])
  })
});
