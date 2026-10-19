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
  test('TT-CLOSE-01: Tooltip should request one dismissal on Escape without closing a parent Overlay', async ({
    mount,
    page,
  }) => {
    await mount('components/Tooltip/Tooltip/NestedOverlay')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()

    const dialog = page.getByTestId('dialog-content')
    const trigger = page.getByTestId('nested-tooltip-trigger')
    const tip = page.getByTestId('nested-tooltip-content')

    await page.getByTestId('dialog-trigger').click()
    await expect(dialog).toBeVisible()

    // Mouse-opened dialog autofocus must NOT pop the tip (TT-FOCUS-03 regression).
    await expect(trigger).toBeFocused()
    await expect(tip).toHaveCount(0)

    // RED-TT: .blur() is synchronously reclaimed by the lock and a lone Tab
    // wraps to self with NO focus event — so Tab away to the sr-only second
    // tabbable and Shift+Tab back: the open below is an honest keyboard Tab
    // arrival with a ring. pressTab is dir-aware (WK: Alt+Tab chords).
    await pressTab(page)
    await expect(page.getByTestId('nested-dialog-sr-next')).toBeFocused()
    await pressTab(page, 'back')
    await expect(trigger).toBeFocused()
    await expect(tip).toBeVisible()
    await page.waitForTimeout(200)
    await snap(page, 'nested-dialog-tooltip-open')

    await page.keyboard.press('Escape')
    await expect(tip).toHaveCount(0)
    await expect(dialog).toBeVisible()
    await page.waitForTimeout(200)
    await snap(page, 'nested-dialog-tooltip-dismissed')
  })
});
