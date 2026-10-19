/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus visual grid (FEATURES #1)', () => {
  test('RF-GRID-06: RTL reverses only the horizontal grid axis', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusGridFixture', { dir: 'rtl' })
    await expect(page.getByTestId('roving-focus-grid-root')).toBeVisible()
    const cell = (i: number) => page.getByTestId(`grid-${i}`)

    await cell(4).focus()
    await page.keyboard.press('ArrowLeft')
    await expect(cell(5)).toBeFocused()

    await cell(4).focus()
    await page.keyboard.press('ArrowRight')
    await expect(cell(3)).toBeFocused()

    await cell(4).focus()
    await page.keyboard.press('ArrowUp')
    await expect(cell(1)).toBeFocused()

    await cell(4).focus()
    await page.keyboard.press('ArrowDown')
    await expect(cell(7)).toBeFocused()
  })
});
