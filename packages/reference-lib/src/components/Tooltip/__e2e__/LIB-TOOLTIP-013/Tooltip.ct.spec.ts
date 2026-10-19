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
  test('TT-CLOSE-03: Tooltip should dismiss and suppress hover reopening when its open Trigger is clicked', async ({
    mount,
    page,
  }) => {
    await mount('components/Tooltip/Tooltip/Basic')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()

    const btnA = page.getByTestId('btn-tooltip-a')
    const contentA = page.getByTestId('tooltip-content-a')

    await btnA.hover()
    await expect(contentA).toBeVisible()

    await btnA.click()
    await expect(contentA).toHaveCount(0)
    await page.waitForTimeout(80)
    await expect(contentA).toHaveCount(0)

    await page.getByTestId('btn-outside').hover()
    await btnA.hover()
    await expect(contentA).toBeVisible()
  })
});
