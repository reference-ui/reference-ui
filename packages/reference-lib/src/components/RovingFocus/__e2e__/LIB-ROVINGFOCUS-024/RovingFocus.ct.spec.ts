/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus visual grid (FEATURES #1)', () => {
  test('RF-GRID-07: vertical moves follow post-reflow rectangles', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusReflowFixture', { loop: false })
    await expect(page.getByTestId('roving-focus-reflow-root')).toBeVisible()
    const cell = (i: number) => page.getByTestId(`flow-${i}`)

    await cell(0).focus()
    await page.keyboard.press('ArrowDown')
    await expect(cell(3)).toBeFocused()

    // Narrow through a ref write: no collection rerender, new wrapping.
    await page.getByTestId('reflow-narrow').click()
    await cell(0).focus()
    await page.keyboard.press('ArrowDown')
    await expect(cell(2)).toBeFocused()
    await expect(cell(2)).toHaveAttribute('tabindex', '0')
    await expect(cell(3)).toHaveAttribute('tabindex', '-1')
  })
});
