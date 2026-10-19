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
  test('TT-GROUP-02: Tooltip should close the current instance before requesting its neighbor', async ({
    mount,
    page,
  }) => {
    await mount('components/Tooltip/Tooltip/Group')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()

    const btnA = page.getByTestId('btn-group-a')
    const btnB = page.getByTestId('btn-group-b')
    const contentA = page.getByTestId('tooltip-group-a')
    const contentB = page.getByTestId('tooltip-group-b')

    await btnA.hover()
    await page.waitForTimeout(220)
    await expect(contentA).toBeVisible()

    await btnB.hover()
    await expect(contentA).toHaveCount(0)
    await expect(contentB).toBeVisible({ timeout: 150 })
    await expect(page.locator('[role="tooltip"]')).toHaveCount(1)
  })
});
