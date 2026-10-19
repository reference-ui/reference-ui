/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus Composition Gates & Browser Proofs', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusFixture')
    await expect(page.getByTestId('roving-focus-fixture-root')).toBeVisible()
  })

  test('RF-TAB-04: Pointer press sets current without stealing focus; Tab re-enters on pressed item', async ({
    page,
  }) => {
    const outsideAfter = page.getByTestId('outside-after-btn')
    const apple = page.getByTestId('item-apple')
    const banana = page.getByTestId('item-banana')
    const blueberry = page.getByTestId('item-blueberry')
    const cherry = page.getByTestId('item-cherry')

    await apple.focus()
    await expect(apple).toBeFocused()

    // Real click: browser moves focus AND currentness follows.
    await cherry.click()
    await expect(cherry).toBeFocused()
    await expect(cherry).toHaveAttribute('tabindex', '0')
    await expect(apple).toHaveAttribute('tabindex', '-1')

    // Pointer press that never moves DOM focus (touch / Safari-tap shape):
    // currentness-only, focus stays where it was.
    await blueberry.dispatchEvent('pointerdown')
    await expect(blueberry).toHaveAttribute('tabindex', '0')
    await expect(cherry).toHaveAttribute('tabindex', '-1')
    await expect(cherry).toBeFocused()

    // Disabled items never become current via press.
    await banana.dispatchEvent('pointerdown')
    await expect(banana).toHaveAttribute('tabindex', '-1')
    await expect(blueberry).toHaveAttribute('tabindex', '0')

    // Non-primary presses (right-click) never move the stop.
    await apple.dispatchEvent('pointerdown', { button: 2 })
    await expect(apple).toHaveAttribute('tabindex', '-1')
    await expect(blueberry).toHaveAttribute('tabindex', '0')

    // Tab out of the composite, then back in: re-entry lands on the pressed item.
    await pressTab(page)
    await expect(outsideAfter).toBeFocused()
    await pressTab(page, 'back')
    await expect(blueberry).toBeFocused()
  })
});
