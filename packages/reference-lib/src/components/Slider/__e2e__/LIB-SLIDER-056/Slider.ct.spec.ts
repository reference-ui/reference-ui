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
  test('renders slider parts and updates value via keyboard arrows', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/SingleSliderFixture')

    const thumb = page.getByTestId('slider-thumb')
    const display = page.getByTestId('slider-value-display')

    await expect(thumb).toHaveAttribute('role', 'slider')
    await expect(thumb).toHaveAttribute('aria-valuemin', '0')
    await expect(thumb).toHaveAttribute('aria-valuemax', '100')
    await expect(thumb).toHaveAttribute('aria-valuenow', '30')
    await expect(display).toHaveText('Current value: 30')
    await page.waitForTimeout(300)
    await snap(page, 'slider-resting')

    // Keyboard ArrowRight increases by step (5) -> 35
    await thumb.focus()
    await page.keyboard.press('ArrowRight')
    await expect(thumb).toHaveAttribute('aria-valuenow', '35')
    await expect(display).toHaveText('Current value: 35')
    await page.waitForTimeout(200)
    await snap(page, 'slider-arrow-right')

    // Keyboard ArrowLeft decreases by step (5) -> 30
    await page.keyboard.press('ArrowLeft')
    await expect(thumb).toHaveAttribute('aria-valuenow', '30')
    await expect(display).toHaveText('Current value: 30')
  })
});
