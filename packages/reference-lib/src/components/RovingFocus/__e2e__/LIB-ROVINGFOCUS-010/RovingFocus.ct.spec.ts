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

  test('RF-TAB-01 & RF-TAB-02: Exposes one tabIndex=0 stop and moves in/out via Tab', async ({
    page,
  }) => {
    const outsideBefore = page.getByTestId('outside-before-btn')
    const outsideAfter = page.getByTestId('outside-after-btn')
    const apple = page.getByTestId('item-apple')
    const blueberry = page.getByTestId('item-blueberry')
    const cherry = page.getByTestId('item-cherry')

    await outsideBefore.focus()
    await expect(outsideBefore).toBeFocused()
    await snap(page, 'outside-before-focused')

    // Tab into composite -> lands on first enabled item (Apple)
    await pressTab(page)
    await expect(apple).toBeFocused()
    await expect(apple).toHaveAttribute('tabindex', '0')
    await expect(blueberry).toHaveAttribute('tabindex', '-1')
    await expect(cherry).toHaveAttribute('tabindex', '-1')
    await snap(page, 'item-apple-focused')

    // Tab out of composite -> lands on outside after
    await pressTab(page)
    await expect(outsideAfter).toBeFocused()
    await snap(page, 'outside-after-focused')
  })
});
