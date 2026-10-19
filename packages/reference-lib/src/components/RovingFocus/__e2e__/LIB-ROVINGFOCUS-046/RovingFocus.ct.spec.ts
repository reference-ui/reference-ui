/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus typeahead browser behavior', () => {
  test('RF-TYPE-10: typeahead ignores editable targets and modified shortcuts', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusLabelsFixture', { typeahead: true })
    await expect(page.getByTestId('roving-focus-labels-root')).toBeVisible()
    const input = page.getByTestId('labels-input')

    // Focus entry legitimately makes the input's item current (RF-TAB-04);
    // the typing itself must change nothing further.
    await input.focus()
    await expect(page.getByTestId('labels-input-item')).toHaveAttribute('tabindex', '0')
    await page.keyboard.type('ab')
    await expect(input).toHaveValue('ab')
    await expect(input).toBeFocused()
    await expect(page.getByTestId('labels-input-item')).toHaveAttribute('tabindex', '0')
    await expect(page.getByTestId('labels-x')).toHaveAttribute('tabindex', '-1')

    const bravo = page.getByTestId('labels-bravo')
    await bravo.focus()
    await page.keyboard.press('Alt+a')
    await expect(bravo).toBeFocused()
    await page.keyboard.press('Control+ArrowDown')
    await expect(bravo).toBeFocused()
    await page.keyboard.press('Meta+ArrowUp')
    await expect(bravo).toBeFocused()
    await expect(bravo).toHaveAttribute('tabindex', '0')
  })
});
