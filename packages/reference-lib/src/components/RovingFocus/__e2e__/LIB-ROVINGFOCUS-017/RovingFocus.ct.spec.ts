/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus Space typeahead guard', () => {
  test.beforeEach(async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusSpaceFixture')
    await expect(page.getByTestId('roving-focus-space-root')).toBeVisible()
  })

  test('RF-TYPE-06 complement: Space with an empty buffer keeps native button activation', async ({
    page,
  }) => {
    const blueberry = page.getByTestId('space-blueberry')
    const count = page.getByTestId('space-activation-count')

    await blueberry.focus()
    await expect(blueberry).toBeFocused()

    // No buffer: Space is not typeahead input — the button activates natively.
    await page.keyboard.press('Space')
    await expect(count).toHaveText('1')
    await expect(blueberry).toBeFocused()
  })
});
