/**
 * RovingFocus composition gates and browser proofs. Pins the single tab
 * stop and Tab travel, arrow movement with disabled skipping and looping,
 * Home/End endpoints, press-without-focus currentness, typeahead matching,
 * and the Space guard that keeps presses out of the search buffer.
 */
import { test, expect, snap, pressTab, isWebKit } from '../../../../../playwright/ct'

test.describe('RovingFocus one-dimensional keys', () => {
  test('RF-KEY-09: modified navigation keys preserve application shortcuts', async ({
    mount,
    page,
  }) => {
    await mount('components/RovingFocus/RovingFocus/RovingFocusKeysFixture')
    await expect(page.getByTestId('roving-focus-keys-root')).toBeVisible()
    const b = page.getByTestId('keys-b')
    const count = page.getByTestId('keys-ancestor-count')

    await b.focus()
    let seen = 0
    // WK reserves Control/Meta+Arrow for browser nav (Control+ArrowLeft unloads
    // to about:blank) — untestable in-browser; Alt proves the contract on WK.
    const mods = (['Alt', 'Control', 'Meta'] as const).filter(m => m === 'Alt' || !isWebKit(page))
    for (const mod of mods) {
      for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'] as const) {
        await page.keyboard.press(`${mod}+${key}`)
        await expect(b).toBeFocused()
        await expect(b).toHaveAttribute('tabindex', '0')
        // Each combo dispatches two keydowns (modifier + key); the consumer
        // ancestor receives both while the kernel consumes neither.
        seen += 2
        await expect(count).toHaveText(String(seen))
      }
    }
  })
});
