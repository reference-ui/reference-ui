/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus one-dimensional keys', () => {
  test('RF-KEY-08: consumer prevention stops movement, propagation stopping does not', async ({
    mount,
    page,
  }) => {
    // Repeat mounts are root updates (state persists), so unmount between
    // phases for true fresh-state runs.
    const first = await mount('components/RovingFocus/RovingFocus/RovingFocusKeysFixture', {
      cancelMode: 'prevent',
    })
    await expect(page.getByTestId('roving-focus-keys-root')).toBeVisible()
    const b = page.getByTestId('keys-b')

    await b.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('keys-cancel-flag')).toHaveText('yes')
    await expect(b).toBeFocused()
    await expect(b).toHaveAttribute('tabindex', '0')
    await first.unmount()

    await mount('components/RovingFocus/RovingFocus/RovingFocusKeysFixture', {
      cancelMode: 'stop',
    })
    await expect(page.getByTestId('roving-focus-keys-root')).toBeVisible()
    const d = page.getByTestId('keys-d')

    await b.focus()
    await page.keyboard.press('ArrowRight')
    await expect(d).toBeFocused()
    await expect(d).toHaveAttribute('tabindex', '0')
    await expect(page.getByTestId('keys-ancestor-count')).toHaveText('0')
  })
});
