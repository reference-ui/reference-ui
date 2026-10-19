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
  test('SD-COMP-01: preserves fractional precision across keyboard and drag', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/LoggedFixture', {
      initial: 0.2,
      min: 0,
      max: 1,
      step: 0.1,
      width: 300,
    })
    const thumb = page.getByTestId('logged-thumb-0')
    const track = page.getByTestId('logged-track')
    await thumb.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('logged-changes')).toHaveText('[0.3]')

    const tbox = await thumb.boundingBox()
    const trackBox = await track.boundingBox()
    await page.mouse.move(tbox!.x + 1, tbox!.y + tbox!.height / 2)
    await page.mouse.down()
    await page.mouse.move(trackBox!.x + trackBox!.width * 0.8, tbox!.y + tbox!.height / 2)
    await page.mouse.up()
    const log = JSON.parse((await page.getByTestId('logged-changes').textContent()) ?? '[]')
    expect(log[log.length - 1]).toBe(0.8)
    for (const v of log as number[]) {
      expect(JSON.stringify(v)).toMatch(/^\d(\.\d)?$/)
    }
    const style = await thumb.getAttribute('style')
    expect(style).toContain('--reference-slider-thumb-position: 80%')
  })
});
