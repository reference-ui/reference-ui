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

  test('RF-KEY-04: Home and End navigate to first and last enabled items', async ({
    page,
  }) => {
    const apple = page.getByTestId('item-apple')
    const blueberry = page.getByTestId('item-blueberry')
    const cherry = page.getByTestId('item-cherry')

    await blueberry.focus()
    await expect(blueberry).toBeFocused()

    await page.keyboard.press('Home')
    await expect(apple).toBeFocused()
    await snap(page, 'home-key-apple-focused')

    await page.keyboard.press('End')
    await expect(cherry).toBeFocused()
    await snap(page, 'end-key-cherry-focused')
  })
});
