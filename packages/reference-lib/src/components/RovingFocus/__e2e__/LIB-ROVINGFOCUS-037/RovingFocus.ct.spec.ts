/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus tab stops and currentness', () => {
  test('RF-TAB-07: no tab stop when every Item is unavailable', async ({ mount, page }) => {
    const errors: Error[] = []
    page.on('pageerror', err => errors.push(err))
    await mount('components/RovingFocus/RovingFocus/RovingFocusDynamicFixture')
    await expect(page.getByTestId('roving-focus-dynamic-root')).toBeVisible()
    const before = page.getByTestId('dyn-outside-before')

    await page.getByTestId('dyn-a').focus()
    await page.getByTestId('dyn-disable-all').click()
    await expect(page.locator('[data-testid^="dyn-"][tabindex="0"]')).toHaveCount(0)

    await before.focus()
    for (const key of ['ArrowRight', 'ArrowDown', 'Home', 'End', 'x'] as const) {
      await page.keyboard.press(key)
      await expect(before).toBeFocused()
    }
    await expect(page.locator('[data-testid^="dyn-"][tabindex="0"]')).toHaveCount(0)
    expect(errors).toEqual([])
  })
});
