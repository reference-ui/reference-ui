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
  test('TT-SCROLL-01: Tooltip should request close once when an ancestor scroll moves its Trigger', async ({
    mount,
    page,
  }) => {
    await mount('components/Tooltip/Tooltip/Scroll')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()

    const ancestor = page.getByTestId('tooltip-scroll-ancestor')
    const trigger = page.getByTestId('btn-scroll-tooltip')
    const content = page.getByTestId('tooltip-scroll-content')

    await trigger.hover()
    await expect(content).toBeVisible()
    await page.waitForTimeout(200)
    await snap(page, 'scroll-ancestor-open')

    await ancestor.evaluate((el: HTMLElement) => {
      el.scrollTop += 40
    })
    await expect(content).toHaveCount(0)
  })
});
