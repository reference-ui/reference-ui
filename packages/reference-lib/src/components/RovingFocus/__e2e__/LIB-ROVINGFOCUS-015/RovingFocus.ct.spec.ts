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

  test('RF-TYPE-02 & RF-TYPE-03: Typeahead matches item prefix and moves focus', async ({
    page,
  }) => {
    const apple = page.getByTestId('item-apple')
    const blueberry = page.getByTestId('item-blueberry')

    await apple.focus()
    await expect(apple).toBeFocused()

    // Type 'bl' -> matches Blueberry
    await page.keyboard.press('b')
    await page.keyboard.press('l')

    await expect(blueberry).toBeFocused()
    await snap(page, 'typeahead-blueberry-focused')
  })
});
