/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus typeahead browser behavior', () => {
  test('RF-TYPE-11: buffered search skips newly disabled or unmounted matches', async ({
    mount,
    page,
  }) => {
    const first = await mount('components/RovingFocus/RovingFocus/RovingFocusLabelsFixture', {
      typeahead: true,
    })
    await expect(page.getByTestId('roving-focus-labels-root')).toBeVisible()

    // Disabling the focused control drops DOM focus to the body, so re-enter
    // through X (buffer 'b' persists — it is time-based, not focus-based)
    // and continue typing: 'br' must skip Bravo for Bread.
    await page.getByTestId('labels-x').focus()
    await page.keyboard.press('b')
    await expect(page.getByTestId('labels-bravo')).toBeFocused()
    await page.getByTestId('labels-disable-bravo').click()
    await page.getByTestId('labels-x').focus()
    await page.keyboard.press('r')
    await expect(page.getByTestId('labels-bread')).toBeFocused()
    await expect(page.getByTestId('labels-bravo')).toHaveAttribute('tabindex', '-1')
    await first.unmount()

    await mount('components/RovingFocus/RovingFocus/RovingFocusLabelsFixture', { typeahead: true })
    await page.getByTestId('labels-x').focus()
    await page.keyboard.press('b')
    await expect(page.getByTestId('labels-bravo')).toBeFocused()
    await page.getByTestId('labels-remove-bravo').click()
    await expect(page.getByTestId('labels-bravo')).toHaveCount(0)
    await page.getByTestId('labels-x').focus()
    await page.keyboard.press('r')
    await expect(page.getByTestId('labels-bread')).toBeFocused()
  })
});
