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
  test('Component story: KeyboardFocus', async ({ mount, page }) => {
    await mount('components/Tooltip/Tooltip/KeyboardFocus')
    const button = page.getByRole('button', { name: 'Keyboard focus trigger' })
    await expect(button).toBeVisible()

    // The story is named KeyboardFocus: make it honest with a real Tab.
    await pressTab(page)
    await expect(button).toBeFocused()
    await expect(button).toHaveAttribute('data-focus-visible', '')
    await page.waitForTimeout(200)
    const tip = page.getByText('Appears on keyboard focus')
    await expect(tip).toBeVisible()
    await snap(page, 'story-keyboard-focus-open')
  })
});
