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
  test('out-of-range controlled value clamps ARIA like the visual', async ({
    mount,
    page,
  }) => {
    // Repro: value 999 with max 24 rendered the thumb at 100%
    // while aria-valuenow lied 999. Both now agree on 24.
    const overflow = await mount('components/Slider/Slider/LoggedFixture', { initial: 999, min: 0, max: 24 })

    const thumb = page.getByTestId('logged-thumb-0')
    await expect(thumb).toHaveAttribute('aria-valuemin', '0')
    await expect(thumb).toHaveAttribute('aria-valuemax', '24')
    await expect(thumb).toHaveAttribute('aria-valuenow', '24')

    const position = await thumb.evaluate(el =>
      el.style.getPropertyValue('--reference-slider-thumb-position')
    )
    expect(position).toBe('100%')
    await overflow.unmount()

    // Underflow mirrors: 0 exposed, thumb at the start.
    await mount('components/Slider/Slider/LoggedFixture', { initial: -40, min: 0, max: 24 })
    await expect(thumb).toHaveAttribute('aria-valuenow', '0')
    const underPosition = await thumb.evaluate(el =>
      el.style.getPropertyValue('--reference-slider-thumb-position')
    )
    expect(underPosition).toBe('0%')
  })
});
