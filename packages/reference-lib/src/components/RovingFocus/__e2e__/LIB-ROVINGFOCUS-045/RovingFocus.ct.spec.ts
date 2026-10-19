/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus typeahead browser behavior', () => {
  test('RF-TYPE-09: searches use textValue, aria-label, then rendered text live', async ({
    mount,
    page,
  }) => {
    const first = await mount('components/RovingFocus/RovingFocus/RovingFocusLabelsFixture', {
      typeahead: true,
    })
    await expect(page.getByTestId('roving-focus-labels-root')).toBeVisible()

    await page.getByTestId('labels-bravo').focus()
    await page.keyboard.press('x')
    await expect(page.getByTestId('labels-x')).toBeFocused()
    await first.unmount()

    const second = await mount('components/RovingFocus/RovingFocus/RovingFocusLabelsFixture', {
      typeahead: true,
    })
    await page.getByTestId('labels-drop-textvalue').click()
    await page.getByTestId('labels-bravo').focus()
    await page.keyboard.press('x')
    await expect(page.getByTestId('labels-bravo')).toBeFocused()
    await page.waitForTimeout(1100)
    await page.keyboard.press('y')
    await expect(page.getByTestId('labels-x')).toBeFocused()
    await second.unmount()

    await mount('components/RovingFocus/RovingFocus/RovingFocusLabelsFixture', { typeahead: true })
    await page.getByTestId('labels-drop-textvalue').click()
    await page.getByTestId('labels-drop-aria').click()
    await page.getByTestId('labels-bravo').focus()
    await page.keyboard.press('z')
    await expect(page.getByTestId('labels-x')).toBeFocused()
  })
});
