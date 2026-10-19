/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus visual grid (FEATURES #1)', () => {
  test('RF-GRID-05: grid wraps within geometry with loop', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusRaggedGridFixture', { loop: true })
    await expect(page.getByTestId('roving-focus-ragged-root')).toBeVisible()
    const m = page.getByTestId('rag-m')
    const l = page.getByTestId('rag-l')
    const r = page.getByTestId('rag-r')
    const w = page.getByTestId('rag-w')

    await r.focus()
    await page.keyboard.press('ArrowRight')
    await expect(l).toBeFocused()

    await l.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(r).toBeFocused()

    await w.focus()
    await page.keyboard.press('ArrowDown')
    await expect(m).toBeFocused()

    await m.focus()
    await page.keyboard.press('ArrowUp')
    await expect(w).toBeFocused()
  })
});
