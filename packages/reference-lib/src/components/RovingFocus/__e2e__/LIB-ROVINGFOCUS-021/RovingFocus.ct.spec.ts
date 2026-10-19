/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus visual grid (FEATURES #1)', () => {
  test('RF-GRID-04: grid focus stays at edges without loop', async ({ mount, page }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusRaggedGridFixture')
    await expect(page.getByTestId('roving-focus-ragged-root')).toBeVisible()

    for (const [id, key] of [
      ['rag-m', 'ArrowUp'],
      ['rag-l', 'ArrowLeft'],
      ['rag-r', 'ArrowRight'],
      ['rag-w', 'ArrowDown'],
    ] as const) {
      const edge = page.getByTestId(id)
      await edge.focus()
      await page.keyboard.press(key)
      await expect(edge).toBeFocused()
      await expect(edge).toHaveAttribute('tabindex', '0')
    }
  })
});
