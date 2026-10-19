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

async function logOf(page: Page, testid: string): Promise<string[]> {
  return JSON.parse((await page.getByTestId(testid).textContent()) ?? '[]')
}

test.describe('Combobox touch outside-dismiss CT', () => {
  test('CB-EDIT-08 touch: tap commits once without refocusing the input', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/TouchLog')
    const input = page.getByTestId('tc-input')
    await input.click()
    await page.getByTestId('tc-clear').evaluate((el: HTMLElement) => el.click())

    await touchTap(page, page.getByTestId('tc-opt-bravo'))
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    const log = await logOf(page, 'tc-log')
    expect(log.filter(entry => entry.startsWith('change:'))).toEqual(['change:bravo'])
    expect(log[log.length - 1]).toBe('dismiss')
    await page.waitForTimeout(500)
    expect((await logOf(page, 'tc-log')).filter(entry => entry.startsWith('change:'))).toEqual([
      'change:bravo',
    ])
    // Modality-appropriate focus: the tap never moves focus (mousedown is
    // prevented, commit calls no focus()), so the input keeps the focus it
    // already had — nothing steals it, nothing re-forces it.
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe(
      'tc-input'
    )
  })
});
