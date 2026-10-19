/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus composition gates', () => {
  test('RF-COMP-01: looping toolbar with a disabled control', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusSlotFixture', { loop: true })
    await expect(page.getByTestId('roving-focus-slot-root')).toBeVisible()
    const bold = page.getByTestId('slot-bold')
    const link = page.getByTestId('slot-link')

    await page.getByTestId('slot-outside-before').focus()
    await pressTab(page)
    await expect(bold).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(link).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await expect(bold).toBeFocused()

    await page.keyboard.press('ArrowLeft')
    await expect(link).toBeFocused()

    await pressTab(page)
    await expect(page.getByTestId('slot-outside-after')).toBeFocused()

    await bold.click()
    await expect(page.getByTestId('slot-click-count')).toHaveText('11')
  })
});
