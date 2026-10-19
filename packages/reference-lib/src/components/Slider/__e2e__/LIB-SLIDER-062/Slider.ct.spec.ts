/**
 * Slider browser proof: parts, sessions, and focus rings. Renders the
 * story fixtures to pin part anatomy and clamped ARIA, keyboard and
 * pointer value changes, track-press thumb choice, RTL and vertical
 * mapping, session lifecycles, StrictMode and ShadowRoot behavior, and
 * keyboard-only focus-ring parity.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Slider pins', () => {
  test('SD-KEY-02: reverses only horizontal Left/Right arrows under inherited RTL', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/LoggedFixture', { initial: 20, dir: 'rtl', width: 100 })
    const thumb = page.getByTestId('logged-thumb-0')
    const changes = page.getByTestId('logged-changes')
    await thumb.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('ArrowDown')
    await expect(changes).toHaveText('[19,20,21,20]')
    await expect(thumb).toBeFocused()
  })
});
