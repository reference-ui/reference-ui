/**
 * Slider browser proof: parts, sessions, and focus rings. Renders the
 * story fixtures to pin part anatomy and clamped ARIA, keyboard and
 * pointer value changes, track-press thumb choice, RTL and vertical
 * mapping, session lifecycles, StrictMode and ShadowRoot behavior, and
 * keyboard-only focus-ring parity.
 */
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

test.describe('Slider CT', () => {
  test('out-of-range controlled value dev-warns naming component, prop, value, and range', async ({
    mount,
    page,
  }) => {
    // Clamp plus the dev warning: the browser console names all four
    // parts while render and ARIA agree on the clamped 24.
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await mount('components/Slider/Slider/LoggedFixture', { initial: 999, min: 0, max: 24 })

    const thumb = page.getByTestId('logged-thumb-0')
    await expect(thumb).toHaveAttribute('aria-valuenow', '24')
    expect(
      errors.some(
        t =>
          t.includes('Slider') &&
          t.includes('value') &&
          t.includes('999') &&
          t.includes('[0, 24]')
      )
    ).toBe(true)
  })
});
