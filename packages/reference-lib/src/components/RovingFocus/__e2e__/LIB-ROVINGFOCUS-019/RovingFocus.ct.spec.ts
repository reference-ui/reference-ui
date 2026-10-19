/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus visual grid (FEATURES #1)', () => {
  test('RF-GRID-02: vertical moves choose nearest center, ties break by DOM order', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusRaggedGridFixture')
    await expect(page.getByTestId('roving-focus-ragged-root')).toBeVisible()
    const m = page.getByTestId('rag-m')
    const l = page.getByTestId('rag-l')
    const w = page.getByTestId('rag-w')

    // M is exactly equidistant from L and R: DOM order decides.
    await m.focus()
    await page.keyboard.press('ArrowDown')
    await expect(l).toBeFocused()
    await snap(page, 'ragged-tie-down')

    await w.focus()
    await page.keyboard.press('ArrowUp')
    await expect(l).toBeFocused()
  })
});
