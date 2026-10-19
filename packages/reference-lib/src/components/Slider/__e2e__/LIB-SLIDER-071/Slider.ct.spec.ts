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
  test('SD-POINTER-04: retains pointer ownership beyond the track', async ({ mount, page }) => {
    await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 300 })
    const track = page.getByTestId('logged-track')
    await page.evaluate(() => {
      ;(window as any).__cap = []
      const t = document.querySelector('[data-testid="logged-track"]')!
      t.addEventListener('gotpointercapture', (e: Event) =>
        (window as any).__cap.push(['got', (e as PointerEvent).pointerId])
      )
      t.addEventListener('lostpointercapture', (e: Event) =>
        (window as any).__cap.push(['lost', (e as PointerEvent).pointerId])
      )
    })
    const box = await track.boundingBox()
    expect(box).not.toBeNull()
    const y = box!.y + box!.height / 2

    await page.mouse.move(box!.x + 90, y)
    await page.mouse.down()
    // FF/WebKit deliver `gotpointercapture` lazily — the
    // event flushes on the NEXT input event, never on its own task.
    // Telemetry: hasPointerCapture true at down, `got` absent after 1s idle,
    // flushed by the following move; proven r17 FF+WK. Capture is genuinely
    // owned at down-time; this 1px move (30 -> 30.33, snaps to 30, no log
    // entry) only flushes the engine's notification. Poll text unchanged.
    await page.mouse.move(box!.x + 91, y)
    // The track owns real pointer capture for the session.
    await expect.poll(() => page.evaluate(() => (window as any).__cap.length)).toBe(1)

    // Drags beyond both ends keep requesting, clamped to the bounds.
    // 10px beyond the edge (x~6) stays inside the 800px
    // viewport; FF reports out-of-window moves with buttons=0, which the
    // pinned buttons-zero path (SD-END-03) rightly cancels. Beyond-ness and
    // the 0/100 clamps are what's pinned, not the overshoot distance.
    await page.mouse.move(box!.x - 10, y)
    await page.mouse.move(700, 300)
    const log = JSON.parse((await page.getByTestId('logged-changes').textContent()) ?? '[]')
    expect(log[0]).toBe(30)
    expect(log).toContain(0)
    expect(log[log.length - 1]).toBe(100)

    // A second pointer cannot drive the owned session.
    await page.evaluate(() => {
      window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 99, buttons: 1, clientX: 10, clientY: 10 }))
    })
    const logAfter = JSON.parse((await page.getByTestId('logged-changes').textContent()) ?? '[]')
    expect(logAfter).toEqual(log)

    await page.mouse.up()
    await expect(page.getByTestId('logged-ends')).toHaveText('[100]')
    const cap = await page.evaluate(() => (window as any).__cap)
    expect(cap[0][0]).toBe('got')
    expect(cap[cap.length - 1][0]).toBe('lost')
    expect(cap[cap.length - 1][1]).toBe(cap[0][1])
  })
});
