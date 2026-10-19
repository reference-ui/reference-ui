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
  test('SD-ENV-03: preserves the contract inside a ShadowRoot', async ({ mount, page }) => {
    await mount('components/Slider/Slider/ShadowFixture')
    const host = page.getByTestId('shadow-host')
    const thumb0 = host.locator('[data-testid="shadow-thumb-0"]')
    const thumb1 = host.locator('[data-testid="shadow-thumb-1"]')
    await expect(thumb0).toBeVisible()

    // RTL keyboard step through the shadow boundary.
    await thumb0.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('shadow-changes')).toHaveText('[[21,80]]')
    const activeInShadow = await page.evaluate(() => {
      const h = document.querySelector('[data-testid="shadow-host"]')!
      return h.shadowRoot!.activeElement!.getAttribute('data-testid')
    })
    expect(activeInShadow).toBe('shadow-thumb-0')
    await expect(thumb0).toHaveAttribute('aria-valuemax', '80')
    await expect(thumb1).toHaveAttribute('aria-valuemin', '21')

    // Drag the second thumb beyond the track: clamped, captured, released.
    await page.evaluate(() => {
      ;(window as any).__cap = []
      const h = document.querySelector('[data-testid="shadow-host"]')!
      const t = h.shadowRoot!.querySelector('[data-testid="shadow-thumb-1"]')!
      t.addEventListener('gotpointercapture', () => (window as any).__cap.push('got'))
      t.addEventListener('lostpointercapture', () => (window as any).__cap.push('lost'))
    })
    const trackBox = await host.locator('[data-testid="shadow-track"]').boundingBox()
    const tbox = await thumb1.boundingBox()
    expect(trackBox).not.toBeNull()
    expect(tbox).not.toBeNull()
    await page.mouse.move(tbox!.x + tbox!.width / 2, tbox!.y + tbox!.height / 2)
    await page.mouse.down()
    // 10px beyond the edge (x~6) stays inside the 800px
    // viewport (trackBox.x=16, so -50 lands at x=-34). FF
    // reports out-of-window moves with buttons=0, which the pinned
    // buttons-zero path (SD-END-03) rightly cancels — the old -50 drag lost
    // the whole session on FF. Beyond-ness and the 100 clamp are what's
    // pinned, not the overshoot distance.
    await page.mouse.move(trackBox!.x - 10, tbox!.y + tbox!.height / 2)
    await page.mouse.up()
    await expect(page.getByTestId('shadow-changes')).toHaveText('[[21,80],[21,100]]')
    await expect(page.getByTestId('shadow-ends')).toHaveText('[[21,80],[21,100]]')
    expect(await page.evaluate(() => (window as any).__cap)).toEqual(['got', 'lost'])
    await expect(thumb1).toBeFocused()
    const thumbStyle = await thumb1.getAttribute('style')
    expect(thumbStyle).toContain('--reference-slider-thumb-position: 100%')
  })
});
