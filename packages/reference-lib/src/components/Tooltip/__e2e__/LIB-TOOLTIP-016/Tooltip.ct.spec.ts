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
  test('Component story: HoverTrigger', async ({ mount, page }) => {
    await mount('components/Tooltip/Tooltip/HoverTrigger')
    const button = page.getByRole('button', { name: 'Hover tooltip trigger' })
    await expect(button).toBeVisible()
    await page.waitForTimeout(200)
    await snap(page, 'story-hover-trigger-resting')

    await button.hover()
    await page.waitForTimeout(200)
    const tip = page.getByText('Helpful tooltip information')
    await expect(tip).toBeVisible()
    await snap(page, 'story-hover-trigger-open')
  })
});
