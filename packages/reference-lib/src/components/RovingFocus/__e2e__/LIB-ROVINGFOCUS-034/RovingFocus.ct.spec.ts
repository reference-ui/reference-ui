/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus tab stops and currentness', () => {
  test('RF-TAB-03: Shift+Tab enters and leaves through the current Item', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusKeysFixture')
    await expect(page.getByTestId('roving-focus-keys-root')).toBeVisible()
    const before = page.getByTestId('keys-outside-before')
    const after = page.getByTestId('keys-outside-after')
    const b = page.getByTestId('keys-b')

    await b.focus()
    await expect(b).toBeFocused()

    await after.focus()
    await pressTab(page, 'back')
    await expect(b).toBeFocused()

    await pressTab(page, 'back')
    await expect(before).toBeFocused()
  })
});
