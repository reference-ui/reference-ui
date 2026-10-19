/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus visual grid (FEATURES #1)', () => {
  test('RF-GRID-01: orientation=both follows visual rows and columns in a regular grid', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusGridFixture')
    await expect(page.getByTestId('roving-focus-grid-root')).toBeVisible()
    const cell = (i: number) => page.getByTestId(`grid-${i}`)

    await snap(page, 'grid-resting')
    for (const [key, target] of [
      ['ArrowRight', 5],
      ['ArrowLeft', 3],
      ['ArrowUp', 1],
      ['ArrowDown', 7],
    ] as const) {
      await cell(4).focus()
      await page.keyboard.press(key)
      await expect(cell(target)).toBeFocused()
      await expect(cell(target)).toHaveAttribute('tabindex', '0')
    }
    await snap(page, 'grid-center-down')
  })
});
