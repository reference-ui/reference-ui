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

  test('RF-TYPE-06: Space with a nonempty buffer matches a space-containing label and activates nothing', async ({
    page,
  }) => {
    const blueberry = page.getByTestId('space-blueberry')
    const blueBerry = page.getByTestId('space-blue-berry')
    const count = page.getByTestId('space-activation-count')

    await blueberry.focus()
    await expect(blueberry).toBeFocused()
    await expect(count).toHaveText('0')

    // "blue" still prefixes the current item, so focus holds through here.
    for (const ch of ['b', 'l', 'u', 'e']) {
      await page.keyboard.press(ch)
    }
    await expect(blueberry).toBeFocused()

    // Space continues the search: buffer "blue " matches "Blue Berry" only.
    await page.keyboard.press('Space')
    await expect(blueBerry).toBeFocused()
    await expect(blueBerry).toHaveAttribute('tabindex', '0')
    await expect(blueberry).toHaveAttribute('tabindex', '-1')

    // Neither the original nor the matched button activated. Settle first:
    // a late native click must fail this, not slip past an instant assert.
    await page.waitForTimeout(200)
    await expect(count).toHaveText('0')
  })
});
