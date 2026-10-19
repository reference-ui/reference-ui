/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus tab stops and currentness', () => {
  test('RF-TAB-06: current falls next-then-previous when unavailable', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusDynamicFixture')
    await expect(page.getByTestId('roving-focus-dynamic-root')).toBeVisible()
    const before = page.getByTestId('dyn-outside-before')
    const b = page.getByTestId('dyn-b')
    const c = page.getByTestId('dyn-c')

    // Disable the current item: next sibling becomes the stop.
    await b.focus()
    await page.getByTestId('dyn-disable-b').click()
    await expect(c).toHaveAttribute('tabindex', '0')
    await expect(b).toHaveAttribute('tabindex', '-1')
    await before.focus()
    await page.keyboard.press('Tab')
    await expect(c).toBeFocused()

    // Hide the current item: same next fallback.
    await page.getByTestId('dyn-reset').click()
    await b.focus()
    await page.getByTestId('dyn-hide-b').click()
    await expect(c).toHaveAttribute('tabindex', '0')
    await before.focus()
    await page.keyboard.press('Tab')
    await expect(c).toBeFocused()

    // Remove the current item: next sibling wins, nothing stale remains.
    await page.getByTestId('dyn-reset').click()
    await b.focus()
    await page.getByTestId('dyn-remove-b').click()
    await expect(b).toHaveCount(0)
    await expect(c).toHaveAttribute('tabindex', '0')
    await before.focus()
    await page.keyboard.press('Tab')
    await expect(c).toBeFocused()

    // No next sibling: falls back to the previous item.
    await page.getByTestId('dyn-reset').click()
    await page.getByTestId('dyn-remove-c').click()
    await b.focus()
    await page.getByTestId('dyn-remove-b').click()
    await expect(page.getByTestId('dyn-a')).toHaveAttribute('tabindex', '0')
    await before.focus()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('dyn-a')).toBeFocused()
  })
});
