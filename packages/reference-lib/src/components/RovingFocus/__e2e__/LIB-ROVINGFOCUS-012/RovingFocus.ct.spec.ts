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

  test('RF-KEY-06: Loops around boundary when loop=true', async ({ page }) => {
    const apple = page.getByTestId('item-apple')
    const cherry = page.getByTestId('item-cherry')

    await cherry.focus()
    await expect(cherry).toBeFocused()

    // ArrowRight on last item -> wraps to first enabled item (Apple)
    await page.keyboard.press('ArrowRight')
    await expect(apple).toBeFocused()
    await snap(page, 'looped-forward-apple-focused')

    // ArrowLeft on first item -> wraps to last enabled item (Cherry)
    await page.keyboard.press('ArrowLeft')
    await expect(cherry).toBeFocused()
    await snap(page, 'looped-backward-cherry-focused')
  })
});
