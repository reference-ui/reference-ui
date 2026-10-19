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
  test('SD-KEY-07: Shift+Arrow passes through in a real engine', async ({ mount, page }) => {
    await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 100 })
    const thumb = page.getByTestId('logged-thumb-0')
    const changes = page.getByTestId('logged-changes')
    await thumb.focus()
    await page.keyboard.press('Shift+ArrowRight')
    await page.keyboard.press('Shift+ArrowLeft')
    await expect(changes).toHaveText('[]')
    await expect(thumb).toHaveAttribute('aria-valuenow', '20')
    await page.keyboard.press('ArrowRight')
    await expect(changes).toHaveText('[21]')
  })
});
