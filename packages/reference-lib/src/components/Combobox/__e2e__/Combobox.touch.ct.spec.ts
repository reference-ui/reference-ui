import { test, expect } from '../../../../playwright/ct'
import type { Locator, Page } from '@playwright/test'

/**
 * Real trusted touch sequences via CDP Input.dispatchTouchEvent (#12,
 * CB-CLOSE-05). page.touchscreen.tap needs a hasTouch context the CT
 * gallery does not provide; CDP injection produces the full trusted
 * sequence — touchstart, pointerdown/up with pointerType touch, and the
 * compatibility mouse + click flush — on the stock page.
 */
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
  test('CB-CLOSE-05: outside touch dismisses once with no compat-mouse replay', async ({
    mount,
    page,
  }) => {
    await mount('components/Combobox/Combobox/TouchLog')
    const input = page.getByTestId('tc-input')
    await input.click()
    await input.fill('Zulu')
    await page.getByTestId('tc-clear').evaluate((el: HTMLElement) => el.click())

    await touchTap(page, page.getByTestId('tc-outside'))
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(await logOf(page, 'tc-log')).toEqual(['input:Alpha', 'dismiss'])

    // Compatibility mouse/click flush must add no second request.
    await page.waitForTimeout(500)
    expect(await logOf(page, 'tc-log')).toEqual(['input:Alpha', 'dismiss'])
  })

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
})
