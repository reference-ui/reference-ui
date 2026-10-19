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
  test('FEATURES #6: invisible hit-area reaches 24px without repainting the cap', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/LoggedFixture', { initial: 50, width: 100 })
    const thumb = page.getByTestId('logged-thumb-0')
    const box = await thumb.boundingBox()
    expect(box).not.toBeNull()
    // Painted DSP fader cap is untouched: 24 wide, 16 tall.
    expect(box!.width).toBeCloseTo(24, 0)
    expect(box!.height).toBeCloseTo(16, 0)
    const before = await thumb.evaluate(el => {
      const cs = window.getComputedStyle(el, '::before')
      return { content: cs.content, width: cs.width, height: cs.height }
    })
    expect(before.content).toBe('""')
    expect(before.width).toBe('24px')
    expect(before.height).toBe('24px')

    await mount('components/Slider/Slider/LoggedFixture', {
      initial: 50,
      orientation: 'vertical',
      height: 100,
    })
    const vthumb = page.getByTestId('logged-thumb-0')
    const vbox = await vthumb.boundingBox()
    expect(vbox).not.toBeNull()
    expect(vbox!.width).toBeCloseTo(16, 0)
    expect(vbox!.height).toBeCloseTo(24, 0)
    const vbefore = await vthumb.evaluate(el => {
      const cs = window.getComputedStyle(el, '::before')
      return { content: cs.content, width: cs.width, height: cs.height }
    })
    expect(vbefore.content).toBe('""')
    expect(vbefore.width).toBe('24px')
    expect(vbefore.height).toBe('24px')
  })
});
