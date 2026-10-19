/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus visual grid (FEATURES #1)', () => {
  test('RF-GRID-08 & RF-KEY-12: Home/End/PageUp/PageDown are whole-composite in grids', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusGridFixture', {
      disabledEdges: true,
    })
    await expect(page.getByTestId('roving-focus-grid-root')).toBeVisible()
    const cell = (i: number) => page.getByTestId(`grid-${i}`)

    await cell(4).focus()
    await page.keyboard.press('Home')
    await expect(cell(1)).toBeFocused()

    await page.keyboard.press('End')
    await expect(cell(7)).toBeFocused()

    await page.keyboard.press('PageUp')
    await expect(cell(1)).toBeFocused()

    await page.keyboard.press('PageDown')
    await expect(cell(7)).toBeFocused()
  })
});
