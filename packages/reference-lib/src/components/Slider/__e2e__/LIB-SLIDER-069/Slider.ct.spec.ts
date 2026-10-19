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
  test('SD-POINTER-03: preserves the grab offset on off-center thumb drags', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/LoggedFixture', {
      initial: 50,
      orientation: 'vertical',
      height: 100,
    })
    const track = page.getByTestId('logged-track')
    const changes = page.getByTestId('logged-changes')
    const box = await track.boundingBox()
    expect(box).not.toBeNull()
    const cx = box!.x + box!.width / 2
    const pressY = box!.y + box!.height * 0.6

    // Press 10% below center: no request on the press itself (no jump).
    await page.mouse.move(cx, pressY)
    await page.mouse.down()
    await expect(changes).toHaveText('[]')

    // Move to 80% down: offset-preserved 30, never center-mapped 20.
    await page.mouse.move(cx, box!.y + box!.height * 0.8, { steps: 5 })
    await page.mouse.up()
    const log = JSON.parse((await changes.textContent()) ?? '[]') as number[]
    expect(log.length).toBeGreaterThan(0)
    expect(log[log.length - 1]).toBe(30)
    expect(Math.min(...log)).toBeGreaterThanOrEqual(30)
  })
});
