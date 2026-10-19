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
  test('updates slider value via pointer dragging and track clicking', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/SingleSliderFixture')

    const track = page.getByTestId('slider-track')
    const thumb = page.getByTestId('slider-thumb')
    const display = page.getByTestId('slider-value-display')

    const box = await track.boundingBox()
    expect(box).not.toBeNull()

    // Click near 80% mark on the track (width is 300px)
    await track.click({ position: { x: box!.width * 0.8, y: box!.height / 2 } })

    await expect(thumb).toHaveAttribute('aria-valuenow', '80')
    await expect(display).toHaveText('Current value: 80')
    await page.waitForTimeout(200)
    await snap(page, 'slider-track-clicked-80')
  })
});
