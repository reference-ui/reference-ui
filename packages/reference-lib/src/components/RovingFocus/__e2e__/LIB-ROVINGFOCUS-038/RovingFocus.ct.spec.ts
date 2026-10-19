/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus tab stops and currentness', () => {
  test('RF-TAB-08: kernel tabIndex wins over conflicting consumer values', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusSlotFixture')
    await expect(page.getByTestId('roving-focus-slot-root')).toBeVisible()

    await expect(page.getByTestId('slot-toolbar')).toBeVisible()
    const stops = page.locator('[data-testid="slot-toolbar"] [tabindex="0"]')
    await expect(stops).toHaveCount(1)
    await expect(page.getByTestId('slot-bold')).toHaveAttribute('tabindex', '0')

    await page.getByTestId('slot-bold').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('slot-link')).toBeFocused()
    await expect(page.getByTestId('slot-link')).toHaveAttribute('tabindex', '0')
    await expect(stops).toHaveCount(1)
  })
});
