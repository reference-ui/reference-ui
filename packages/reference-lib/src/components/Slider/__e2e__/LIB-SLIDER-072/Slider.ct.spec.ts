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
  test('SD-POINTER-06: accepts only primary input', async ({ mount, page }) => {
    // Real right-button click is ignored.
    await mount('components/Slider/Slider/SingleSliderFixture')
    const thumb = page.getByTestId('slider-thumb')
    await thumb.click({ button: 'right' })
    await expect(thumb).toHaveAttribute('aria-valuenow', '30')

    // Non-primary pointers are ignored in a real engine.
    await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 100 })
    const track = page.getByTestId('logged-track')
    const box = await track.boundingBox()
    expect(box).not.toBeNull()
    await track.dispatchEvent('pointerdown', {
      button: 0,
      isPrimary: false,
      pointerId: 2,
      clientX: box!.x + 60,
      clientY: box!.y + box!.height / 2,
    })
    await expect(page.getByTestId('logged-changes')).toHaveText('[]')
    await expect(page.getByTestId('logged-thumb-0')).not.toHaveAttribute('data-active')

    // A primary pen press is accepted.
    await track.dispatchEvent('pointerdown', {
      button: 0,
      isPrimary: true,
      pointerId: 5,
      pointerType: 'pen',
      clientX: box!.x + 70,
      clientY: box!.y + box!.height / 2,
    })
    await expect(page.getByTestId('logged-changes')).toHaveText('[70]')
    await expect(page.getByTestId('logged-thumb-0')).toBeFocused()
    await page.evaluate(() => {
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 5, clientX: 0, clientY: 0 }))
    })
    await expect(page.getByTestId('logged-ends')).toHaveText('[70]')
  })
});
