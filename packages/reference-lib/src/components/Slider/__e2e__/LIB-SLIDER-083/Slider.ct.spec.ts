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
  test('SD-POINTER-05: drives the drag from one owned touchpoint', async ({
    mount,
    page,
    browserName,
  }) => {
    // HARNESS class (precedent — Combobox CB-COMP
    // touch leg): CDP touch injection (`page.context().newCDPSession`) exists
    // only in Chromium (`CDP session is only available in Chromium` on
    // FF/WebKit by construction). The whole test is CDP-driven, so it is
    // chromium-only; the owned-touchpoint contract stays pinned on Chromium.
    // No product change.
    test.skip(browserName !== 'chromium', 'CDP touch injection is Chromium-only')
    await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 300 })
    const track = page.getByTestId('logged-track')
    const thumb = page.getByTestId('logged-thumb-0')
    const box = await track.boundingBox()
    const tbox = await thumb.boundingBox()
    expect(box).not.toBeNull()
    expect(tbox).not.toBeNull()
    const y = tbox!.y + tbox!.height / 2

    const cdp = await page.context().newCDPSession(page)
    const touch = (type: string, touchPoints: Array<{ x: number; y: number; id?: number }>) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints } as any)

    // Owned touch drags along the track while an unrelated touch moves elsewhere.
    await touch('touchStart', [{ x: tbox!.x + tbox!.width / 2, y, id: 1 }])
    await touch('touchMove', [{ x: box!.x + 90, y, id: 1 }])
    await touch('touchMove', [
      { x: box!.x + 120, y, id: 1 },
      { x: box!.x + 250, y: y + 60, id: 2 },
    ])
    await touch('touchMove', [
      { x: box!.x + 150, y, id: 1 },
      { x: box!.x + 250, y: y + 80, id: 2 },
    ])
    await touch('touchEnd', [])
    const log = JSON.parse((await page.getByTestId('logged-changes').textContent()) ?? '[]')
    // Only the owned touchpoint requests; id 2 (~83) never leaks in.
    expect(log).toEqual([30, 40, 50])
    expect(await page.getByTestId('logged-ends').textContent()).toBe('[50]')

    // No compatibility mouse sequence adds a callback after the gesture.
    await page.waitForTimeout(300)
    expect(JSON.parse((await page.getByTestId('logged-changes').textContent()) ?? '[]')).toEqual([
      30, 40, 50,
    ])
    const touchAction = await page.evaluate(
      () => window.getComputedStyle(document.querySelector('[data-testid="logged-slider"]')!).touchAction
    )
    expect(touchAction).toBe('none')
  })
});
