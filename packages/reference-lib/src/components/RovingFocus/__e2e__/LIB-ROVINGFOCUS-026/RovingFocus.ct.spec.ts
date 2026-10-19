/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus one-dimensional keys', () => {
  test('RF-KEY-02: horizontal arrows reverse under inherited RTL', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusKeysFixture', { dir: 'rtl' })
    await expect(page.getByTestId('roving-focus-keys-root')).toBeVisible()
    const b = page.getByTestId('keys-b')
    const d = page.getByTestId('keys-d')

    await b.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(d).toBeFocused()

    await d.focus()
    await page.keyboard.press('ArrowRight')
    await expect(b).toBeFocused()

    await b.focus()
    await page.keyboard.press('ArrowUp')
    await expect(b).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(b).toBeFocused()
  })
});
