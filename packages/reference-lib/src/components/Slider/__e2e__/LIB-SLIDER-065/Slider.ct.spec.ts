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
  test('SD-DOM-06: right-anchors computed Range geometry in RTL', async ({ mount, page }) => {
    await mount('components/Slider/Slider/LoggedFixture', {
      initial: [20, 70],
      width: 200,
      dir: 'rtl',
    })
    const track = page.getByTestId('logged-track')
    const range = page.getByTestId('logged-range')
    const trackBox = await track.boundingBox()
    const rangeBox = await range.boundingBox()
    expect(trackBox).not.toBeNull()
    expect(rangeBox).not.toBeNull()
    // Start 20% from the right edge, spanning 50% of the track.
    expect(rangeBox!.x + rangeBox!.width).toBeCloseTo(trackBox!.x + trackBox!.width - 0.2 * trackBox!.width, 0)
    expect(rangeBox!.width).toBeCloseTo(0.5 * trackBox!.width, 0)
    const style = await range.getAttribute('style')
    expect(style).toContain('--reference-slider-range-start: 20%')
    expect(style).toContain('--reference-slider-range-end: 70%')
  })
});
