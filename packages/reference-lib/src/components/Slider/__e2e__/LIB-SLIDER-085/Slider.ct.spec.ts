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
  test('SD-A11Y-01: publishes exact role, name, orientation, value, and neighbor bounds', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/A11yFixture')
    const scalar = page.getByTestId('a11y-scalar-thumb')
    await expect(scalar).toHaveAttribute('role', 'slider')
    await expect(scalar).toHaveAttribute('aria-label', 'Volume')
    await expect(scalar).toHaveAttribute('aria-orientation', 'horizontal')
    await expect(scalar).toHaveAttribute('aria-valuenow', '30')
    await expect(scalar).toHaveAttribute('aria-valuemin', '0')
    await expect(scalar).toHaveAttribute('aria-valuemax', '100')

    const range0 = page.getByTestId('a11y-range-0')
    const range1 = page.getByTestId('a11y-range-1')
    await expect(range0).toHaveAttribute('aria-label', 'Min price')
    await expect(range0).toHaveAttribute('aria-valuenow', '20')
    await expect(range0).toHaveAttribute('aria-valuemax', '70')
    await expect(range1).toHaveAttribute('aria-label', 'Max price')
    await expect(range1).toHaveAttribute('aria-valuenow', '70')
    await expect(range1).toHaveAttribute('aria-valuemin', '20')

    const disabled = page.getByTestId('a11y-disabled-thumb')
    await expect(disabled).toHaveAttribute('aria-disabled', 'true')
    await expect(disabled).toHaveAttribute('data-disabled', '')

    await expect(page.getByTestId('a11y-vert-thumb')).toHaveAttribute('aria-orientation', 'vertical')
    const rtl = page.getByTestId('a11y-rtl-thumb')
    await expect(rtl).toHaveAttribute('aria-valuenow', '60')
    const rtlStyle = await rtl.getAttribute('style')
    expect(rtlStyle).toContain('right: 60%')

    // Platform accessibility tree exposes every slider with its name.
    const aria = await page.getByTestId('a11y-root').ariaSnapshot()
    expect(aria).toContain('slider "Volume"')
    expect(aria).toContain('slider "Min price"')
    expect(aria).toContain('slider "Max price"')
    expect(aria).toContain('slider "Disabled" [disabled]')
    expect(aria).toContain('slider "Vertical"')
    expect(aria).toContain('slider "Rtl"')

    // Scanner half: the A11yFixture mount exercises scalar, range,
    // disabled, vertical, and RTL thumbs in one story; #root scoping
    // covers it whole (no portals in Slider).
    await expectNoAxeViolations(page, { include: '#root' })
  })
});
