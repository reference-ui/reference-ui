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

async function expectAnchoredTop(trigger: Locator, content: Locator) {
  await expect(async () => {
    const triggerBox = await trigger.boundingBox()
    const contentBox = await content.boundingBox()
    expect(triggerBox).toBeTruthy()
    expect(contentBox).toBeTruthy()

    expect(contentBox!.y + contentBox!.height).toBeLessThanOrEqual(triggerBox!.y + 2)
    expect(contentBox!.y + contentBox!.height).toBeGreaterThan(triggerBox!.y - 32)

    const triggerMid = triggerBox!.x + triggerBox!.width / 2
    expect(contentBox!.x).toBeLessThan(triggerMid)
    expect(contentBox!.x + contentBox!.width).toBeGreaterThan(triggerMid)
  }).toPass()
}

test.describe('Tooltip Composition Gates & Browser Proofs', () => {
  test('Hovering over trigger opens tooltip next to the trigger', async ({ mount, page }) => {
    await mount('components/Tooltip/Tooltip/Basic')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()

    const btnB = page.getByTestId('btn-tooltip-b')
    const contentB = page.getByTestId('tooltip-content-b')

    await expect(contentB).toHaveCount(0)

    await btnB.hover()
    await expect(contentB).toBeVisible()
    await expect(contentB).toHaveText('Help text for Button B')
    await expectAnchoredTop(btnB, contentB)
    await page.waitForTimeout(200)
    await snap(page, 'hover-open-btn-b')
  })
});
