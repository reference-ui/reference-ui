/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus visual grid (FEATURES #1)', () => {
  test('RF-GRID-03: grid arrows skip disabled cells for valid targets on the axis', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusRaggedGridFixture')
    await expect(page.getByTestId('roving-focus-ragged-root')).toBeVisible()
    const l = page.getByTestId('rag-l')
    const r = page.getByTestId('rag-r')
    const d = page.getByTestId('rag-d')
    const m = page.getByTestId('rag-m')

    await l.focus()
    await page.keyboard.press('ArrowRight')
    await expect(r).toBeFocused()

    await r.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(l).toBeFocused()

    // D is the geometrically nearest cell below M but disabled: L wins.
    await m.focus()
    await page.keyboard.press('ArrowDown')
    await expect(l).toBeFocused()
    await expect(d).toHaveAttribute('tabindex', '-1')
  })
});
