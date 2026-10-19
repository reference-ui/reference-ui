/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus one-dimensional keys', () => {
  test('RF-KEY-03: vertical orientation uses only vertical arrows in LTR and RTL', async ({
    mount,
    page,
  }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      await mount('components/RovingFocus/RovingFocus/RovingFocusKeysFixture', {
        orientation: 'vertical',
        dir,
      })
      await expect(page.getByTestId('roving-focus-keys-root')).toBeVisible()
      const a = page.getByTestId('keys-a')
      const b = page.getByTestId('keys-b')
      const d = page.getByTestId('keys-d')

      await b.focus()
      await page.keyboard.press('ArrowDown')
      await expect(d).toBeFocused()

      await d.focus()
      await page.keyboard.press('ArrowUp')
      await expect(b).toBeFocused()

      await b.focus()
      await page.keyboard.press('ArrowLeft')
      await expect(b).toBeFocused()
      await expect(a).toHaveAttribute('tabindex', '-1')
      await page.keyboard.press('ArrowRight')
      await expect(b).toBeFocused()
    }
  })
});
