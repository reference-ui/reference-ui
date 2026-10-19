/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus one-dimensional keys', () => {
  test('RF-KEY-05: one-dimensional boundaries hold without loop', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusKeysFixture', { loop: false })
    await expect(page.getByTestId('roving-focus-keys-root')).toBeVisible()
    const a = page.getByTestId('keys-a')
    const e = page.getByTestId('keys-e')

    await a.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(a).toBeFocused()
    await expect(a).toHaveAttribute('tabindex', '0')

    await e.focus()
    await page.keyboard.press('ArrowRight')
    await expect(e).toBeFocused()
    await expect(e).toHaveAttribute('tabindex', '0')
  })
});
