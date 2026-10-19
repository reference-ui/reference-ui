/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus typeahead browser behavior', () => {
  test('RF-TYPE-12: searchable text skips decorative glyphs and collapses whitespace', async ({
    mount,
    page,
  }) => {
    const first = await mount('components/RovingFocus/RovingFocus/RovingFocusLabelsFixture', {
      typeahead: true,
    })
    await expect(page.getByTestId('roving-focus-labels-root')).toBeVisible()

    await page.getByTestId('labels-x').focus()
    await page.keyboard.type('spaced out')
    await expect(page.getByTestId('labels-decor')).toBeFocused()
    await expect(page.getByTestId('labels-decor')).toHaveAttribute('tabindex', '0')
    await first.unmount()

    await mount('components/RovingFocus/RovingFocus/RovingFocusLabelsFixture', { typeahead: true })
    await page.getByTestId('labels-x').focus()
    // Dispatched (not typed): type() would skip the keydown for ★ and prove
    // nothing — the kernel must receive it and find no match.
    await page.getByTestId('labels-x').dispatchEvent('keydown', { key: '★' })
    await expect(page.getByTestId('labels-x')).toBeFocused()
  })
});
