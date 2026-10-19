/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus nesting', () => {
  test('RF-NEST-01: nested composite handles supported keys alone', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusNestedFixture')
    await expect(page.getByTestId('roving-focus-nested-root')).toBeVisible()
    const y = page.getByTestId('nested-y')
    const z = page.getByTestId('nested-z')

    await y.focus()
    await expect(page.getByTestId('nested-b')).toHaveAttribute('tabindex', '0')
    await expect(y).toHaveAttribute('tabindex', '0')

    await page.keyboard.press('ArrowRight')
    await expect(z).toBeFocused()
    await expect(z).toHaveAttribute('tabindex', '0')
    await expect(y).toHaveAttribute('tabindex', '-1')
    await expect(page.getByTestId('nested-b')).toHaveAttribute('tabindex', '0')
    await expect(page.getByTestId('nested-a')).toHaveAttribute('tabindex', '-1')
    await expect(page.getByTestId('nested-c')).toHaveAttribute('tabindex', '-1')
    await snap(page, 'nested-inner-focused')
  })
});
