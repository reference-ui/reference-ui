/**
 * Tooltip composition gates and browser proofs. Slotted Triggers gain
 * aria-describedby and show Content on focus and hover, the tip anchors
 * to its trigger, warm-group neighbors open instantly inside the skip
 * window and cold after it, and Escape dismisses once without closing a
 * parent Overlay.
 */
import { test, expect, snap, pressTab } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Locator } from '@playwright/test'

test.describe('Tooltip Composition Gates & Browser Proofs', () => {
  test('TT-SCROLL-03: Tooltip should remain open when scrolling occurs inside an input or textarea Trigger', async ({
    mount,
    page,
  }) => {
    await mount('components/Tooltip/Tooltip/Scroll')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()

    const field = page.getByTestId('tooltip-textarea')
    const content = page.getByTestId('tooltip-textarea-content')

    await field.hover()
    await expect(content).toBeVisible()
    await page.waitForTimeout(200)
    await snap(page, 'scroll-textarea-open')

    await field.evaluate((el: HTMLTextAreaElement) => {
      el.scrollTop = 40
      el.dispatchEvent(new Event('scroll', { bubbles: false }))
    })
    await expect(content).toBeVisible()
  })
});
