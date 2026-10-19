/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus nesting', () => {
  test('RF-NEST-02: unsupported inner keys bubble to the outer composite', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusNestedFixture')
    await expect(page.getByTestId('roving-focus-nested-root')).toBeVisible()
    const y = page.getByTestId('nested-y')
    const c = page.getByTestId('nested-c')

    await y.focus()
    await page.keyboard.press('ArrowDown')
    await expect(c).toBeFocused()
    await expect(c).toHaveAttribute('tabindex', '0')
    await expect(y).toHaveAttribute('tabindex', '0')
    await expect(page.getByTestId('nested-x')).toHaveAttribute('tabindex', '-1')
    await expect(page.getByTestId('nested-z')).toHaveAttribute('tabindex', '-1')
  })
});
