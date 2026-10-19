/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus one-dimensional keys', () => {
  test('RF-KEY-12: PageUp and PageDown match Home and End in one dimension', async ({
    mount,
    page,
  }) => {
    for (const orientation of ['horizontal', 'vertical'] as const) {
      await mount('components/RovingFocus/RovingFocus/RovingFocusKeysFixture', { orientation })
      await expect(page.getByTestId('roving-focus-keys-root')).toBeVisible()
      const a = page.getByTestId('keys-a')
      const b = page.getByTestId('keys-b')
      const e = page.getByTestId('keys-e')

      await b.focus()
      await page.keyboard.press('PageUp')
      await expect(a).toBeFocused()

      await b.focus()
      await page.keyboard.press('PageDown')
      await expect(e).toBeFocused()
    }
  })
});
