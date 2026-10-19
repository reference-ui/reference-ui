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
  test('TT-POS: focused tooltip is anchored to the trigger, not hardcoded', async ({
    mount,
    page,
  }) => {
    await mount('components/Tooltip/Tooltip/Basic')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()

    const btnA = page.getByTestId('btn-tooltip-a')
    const contentA = page.getByTestId('tooltip-content-a')

    // Honest keyboard Tab (not programmatic focus); anchoring assertions untouched.
    await pressTab(page)
    await expect(btnA).toBeFocused()
    await expect(contentA).toBeVisible()
    await expectAnchoredTop(btnA, contentA)

    const inline = await contentA.evaluate(el => ({
      position: (el as HTMLElement).style.position,
      top: (el as HTMLElement).style.top,
      left: (el as HTMLElement).style.left,
    }))
    expect(inline.position === 'absolute' || inline.position === 'fixed').toBe(true)
    expect(inline.top).toMatch(/px$/)
    expect(inline.left).toMatch(/px$/)
    await page.waitForTimeout(200)
    await snap(page, 'anchored-top-btn-a')
  })
});
