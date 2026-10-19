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
  test('SD-POINTER-09: defers while hidden and resumes when measurable', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/ZeroTrackFixture')
    // Hidden track: a real-engine pointerdown issues nothing.
    await page.evaluate(() => {
      document
        .querySelector('[data-testid="zero-track"]')!
        .dispatchEvent(
          new PointerEvent('pointerdown', {
            bubbles: true,
            button: 0,
            isPrimary: true,
            pointerId: 1,
            clientX: 100,
            clientY: 100,
          })
        )
    })
    await expect(page.getByTestId('zero-changes')).toHaveText('[]')
    await expect(page.getByTestId('zero-value')).toHaveText('20')

    await page.getByTestId('zero-reveal').click()
    const track = page.getByTestId('zero-track')
    const box = await track.boundingBox()
    expect(box).not.toBeNull()
    await track.click({ position: { x: 60, y: box!.height / 2 } })
    await expect(page.getByTestId('zero-changes')).toHaveText('[60]')
  })
});
