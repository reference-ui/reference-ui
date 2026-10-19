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
  test('SD-COMP-03: retains a vertical touch gesture beyond the track', async ({
    mount,
    page,
    browserName,
  }) => {
    // HARNESS class, same CDP wall as SD-POINTER-05
    // `newCDPSession` is Chromium-only, and the whole
    // test is CDP-driven touch. Chromium-only; no product change.
    test.skip(browserName !== 'chromium', 'CDP touch injection is Chromium-only')
    await mount('components/Slider/Slider/LoggedFixture', {
      initial: 50,
      orientation: 'vertical',
      height: 200,
    })
    const track = page.getByTestId('logged-track')
    const thumb = page.getByTestId('logged-thumb-0')
    const box = await track.boundingBox()
    const tbox = await thumb.boundingBox()
    expect(box).not.toBeNull()
    expect(tbox).not.toBeNull()
    const cx = tbox!.x + tbox!.width / 2
    const cy = tbox!.y + tbox!.height / 2

    const cdp = await page.context().newCDPSession(page)
    const touch = (type: string, touchPoints: Array<{ x: number; y: number; id?: number }>) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints } as any)

    // Off-center press: no request on contact.
    await touch('touchStart', [{ x: cx, y: cy - 5, id: 1 }])
    await expect(page.getByTestId('logged-changes')).toHaveText('[]')

    // Small move maps 1:1 with the offset (5px above center ~ +2.5 units up).
    await touch('touchMove', [{ x: cx, y: cy - 15, id: 1 }])
    const first = JSON.parse((await page.getByTestId('logged-changes').textContent()) ?? '[]')
    expect(first).toEqual([55])

    // Beyond both ends clamps to max/min.
    await touch('touchMove', [{ x: cx, y: box!.y - 20, id: 1 }])
    await touch('touchMove', [{ x: cx, y: box!.y + box!.height + 20, id: 1 }])
    await touch('touchEnd', [])
    const log = JSON.parse((await page.getByTestId('logged-changes').textContent()) ?? '[]')
    expect(log).toContain(100)
    expect(log).toContain(0)
    expect(log[log.length - 1]).toBe(0)
    await expect(page.getByTestId('logged-ends')).toHaveText('[0]')
    await expect(thumb).not.toHaveAttribute('data-active')
    await expect(thumb).toBeFocused()
  })
});
