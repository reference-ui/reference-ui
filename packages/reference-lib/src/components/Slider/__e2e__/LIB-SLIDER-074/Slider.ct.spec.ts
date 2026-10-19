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
  test('SD-POINTER-08: cleans the session when disabled or capture is lost mid-drag', async ({
    mount,
    page,
  }) => {
    // Real disable mid-drag cancels the session.
    await mount('components/Slider/Slider/ConstraintFixture')
    const track = page.getByTestId('constraint-track')
    const box = await track.boundingBox()
    expect(box).not.toBeNull()
    await page.mouse.move(box!.x + box!.width * 0.4, box!.y + box!.height / 2)
    await page.mouse.down()
    await expect(page.getByTestId('constraint-changes')).toHaveText('["A:40"]')
    await page.evaluate(() => {
      ;(document.querySelector('[data-testid="constraint-disable"]') as HTMLElement).click()
    })
    await page.mouse.move(box!.x + box!.width * 0.8, 10)
    await page.mouse.up()
    await expect(page.getByTestId('constraint-changes')).toHaveText('["A:40"]')
    await expect(page.getByTestId('constraint-ends')).toHaveText('[]')
    await expect(page.getByTestId('constraint-slider')).toHaveAttribute('data-disabled', '')

    // Real lostpointercapture mid-drag cancels without an end report.
    // FF/WebKit flush `gotpointercapture` only on the
    // next input event, so a `got` listener
    // would idle forever here — yet capture IS owned at down-time
    // (hasPointerCapture true). Record the real session pointer id from
    // pointerdown instead. Firefox adds a second rule: releasing
    // while `got` is still pending silently swallows it (no `got`, no `lost`,
    // session survives), so the same-coordinate move below first flushes a
    // real `got` (value-neutral 40 -> 40, no log entry — and a no-op on
    // Chromium where `got` already fired). The release then drives a real
    // lostpointercapture -> cancel path on every engine.
    await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 100 })
    const track2 = page.getByTestId('logged-track')
    await page.evaluate(() => {
      ;(window as any).__downId = null
      document
        .querySelector('[data-testid="logged-track"]')!
        .addEventListener('pointerdown', (e: Event) => {
          ;(window as any).__downId = (e as PointerEvent).pointerId
        })
    })
    const box2 = await track2.boundingBox()
    await page.mouse.move(box2!.x + 40, box2!.y + box2!.height / 2)
    await page.mouse.down()
    await expect(page.getByTestId('logged-changes')).toHaveText('[40]')
    await expect.poll(() => page.evaluate(() => (window as any).__downId)).not.toBeNull()
    await page.mouse.move(box2!.x + 40, box2!.y + box2!.height / 2)
    await page.evaluate(() => {
      ;(document.querySelector('[data-testid="logged-track"]') as HTMLElement).releasePointerCapture(
        (window as any).__downId
      )
    })
    await page.mouse.move(box2!.x + 80, box2!.y + box2!.height / 2)
    await page.mouse.up()
    await expect(page.getByTestId('logged-changes')).toHaveText('[40]')
    await expect(page.getByTestId('logged-ends')).toHaveText('[]')
  })
});
