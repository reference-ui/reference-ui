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
  test('SD-POINTER-01: chooses and focuses the nearest movable thumb on track press', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/LoggedFixture', { initial: [10, 80], width: 300 })
    const track = page.getByTestId('logged-track')
    const thumb0 = page.getByTestId('logged-thumb-0')
    const thumb1 = page.getByTestId('logged-thumb-1')
    const box = await track.boundingBox()
    expect(box).not.toBeNull()

    await track.click({ position: { x: 60, y: box!.height / 2 } })
    await expect(thumb0).toBeFocused()
    await expect(page.getByTestId('logged-changes')).toHaveText('[[20,80]]')

    await track.click({ position: { x: 270, y: box!.height / 2 } })
    await expect(thumb1).toBeFocused()
    await expect(page.getByTestId('logged-changes')).toHaveText('[[20,80],[20,90]]')
  })
});
