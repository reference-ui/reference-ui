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
  test('TT-FOCUS-03: Tooltip should stay shut on mouse-opened dialog autofocus, then open on Tab with a ring', async ({
    mount,
    page,
  }) => {
    await mount('components/Tooltip/Tooltip/NestedOverlay')
    await expect(page.getByTestId('tooltip-fixture-root')).toBeVisible()

    const dialog = page.getByTestId('dialog-content')
    const trigger = page.getByTestId('nested-tooltip-trigger')
    const tip = page.getByTestId('nested-tooltip-content')

    // Mouse-click dialog open: focus correctly moves inside (APG), tip stays shut.
    await page.getByTestId('dialog-trigger').click()
    await expect(dialog).toBeVisible()
    await expect(trigger).toBeFocused()
    await expect(trigger).not.toHaveAttribute('data-focus-visible')
    await expect(tip).toHaveCount(0)

    // Focus away and back via real Tabs: tip opens WITH the ring (TT-FOCUS-01).
    // (RED-TT: .blur() is synchronously reclaimed by the lock, so the "away"
    // leg is an honest Tab to the sr-only second tabbable; the "back" leg is
    // the honest keyboard Shift+Tab through the trap.)
    await pressTab(page)
    await expect(page.getByTestId('nested-dialog-sr-next')).toBeFocused()
    await pressTab(page, 'back')
    await expect(trigger).toBeFocused()
    await expect(trigger).toHaveAttribute('data-focus-visible', '')
    await expect(tip).toBeVisible()
  })
});
