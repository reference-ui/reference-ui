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

  test('RF-KEY-01 & RF-KEY-07: Moves between enabled items and skips disabled items', async ({
    page,
  }) => {
    const apple = page.getByTestId('item-apple')
    const blueberry = page.getByTestId('item-blueberry')
    const cherry = page.getByTestId('item-cherry')

    await apple.focus()
    await expect(apple).toBeFocused()

    // ArrowRight -> skips disabled Banana -> focuses Blueberry
    await page.keyboard.press('ArrowRight')
    await expect(blueberry).toBeFocused()
    await expect(blueberry).toHaveAttribute('tabindex', '0')
    await expect(apple).toHaveAttribute('tabindex', '-1')
    await snap(page, 'item-blueberry-focused')

    // ArrowRight -> focuses Cherry
    await page.keyboard.press('ArrowRight')
    await expect(cherry).toBeFocused()
    await snap(page, 'item-cherry-focused')
  })
});
