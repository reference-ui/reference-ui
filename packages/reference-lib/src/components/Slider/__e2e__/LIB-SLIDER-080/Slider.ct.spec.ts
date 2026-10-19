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
  test('SD-DYNAMIC-02: rerendered constraints apply to the next interaction', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/ConstraintFixture')
    const thumb = page.getByTestId('constraint-thumb')
    await page.getByTestId('constraint-update').click()
    await expect(thumb).toHaveAttribute('aria-orientation', 'vertical')
    await expect(thumb).toHaveAttribute('aria-valuemin', '10')
    await expect(thumb).toHaveAttribute('aria-valuemax', '60')
    await expect(page.getByTestId('constraint-changes')).toHaveText('[]')

    // Next key uses the new grid: (20-10)/5 = 2 -> 3 -> 25.
    await thumb.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('constraint-changes')).toHaveText('["A:25"]')

    // Next pointer action uses the new vertical axis: near-top press -> 55.
    const track = page.getByTestId('constraint-track')
    const box = await track.boundingBox()
    await track.click({ position: { x: box!.width / 2, y: box!.height * 0.1 } })
    await expect(page.getByTestId('constraint-changes')).toHaveText('["A:25","A:55"]')
  })
});
