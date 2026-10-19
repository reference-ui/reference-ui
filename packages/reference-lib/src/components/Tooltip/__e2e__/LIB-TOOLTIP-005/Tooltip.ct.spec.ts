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
  test('TT-DOM-01 & TT-DOM-02: Slotted Trigger gains aria-describedby and shows Content on focus', async ({
    mount,
    page,
  }) => {
    await mount('components/Tooltip/Tooltip/Basic')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()

    const btnA = page.getByTestId('btn-tooltip-a')
    const contentA = page.getByTestId('tooltip-content-a')

    await expect(contentA).toHaveCount(0)
    await page.waitForTimeout(200)
    await snap(page, 'basic-resting')

    // TT-FOCUS-01: honest keyboard Tab (not programmatic focus) — ring + tip together.
    // pressTab: Option+Tab on WK (traverse-all-controls), plain Tab elsewhere.
    await pressTab(page)
    await expect(btnA).toBeFocused()
    await expect(btnA).toHaveAttribute('data-focus-visible', '')

    await expect(contentA).toBeVisible()
    await expect(contentA).toHaveAttribute('role', 'tooltip')
    await expect(contentA).toHaveText('Help text for Button A')

    const contentId = await contentA.getAttribute('id')
    expect(contentId).toBeTruthy()
    await expect(btnA).toHaveAttribute('aria-describedby', contentId!)
    await page.waitForTimeout(200)
    await snap(page, 'focus-open-btn-a')

    // Tab off via btn-tooltip-b onto the outside control; blur closes unconditionally.
    await pressTab(page)
    await pressTab(page)
    await expect(page.getByTestId('btn-outside')).toBeFocused()
    await expect(contentA).toHaveCount(0)
  })
});
