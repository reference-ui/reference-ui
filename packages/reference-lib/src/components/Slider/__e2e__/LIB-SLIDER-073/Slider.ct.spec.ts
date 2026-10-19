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
  test('SD-POINTER-07: releases capture and ends dragging on pointerup', async ({
    mount,
    page,
  }) => {
    await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 300 })
    const track = page.getByTestId('logged-track')
    const thumb = page.getByTestId('logged-thumb-0')
    await page.evaluate(() => {
      ;(window as any).__cap = []
      const t = document.querySelector('[data-testid="logged-track"]')!
      t.addEventListener('gotpointercapture', () => (window as any).__cap.push('got'))
      t.addEventListener('lostpointercapture', () => (window as any).__cap.push('lost'))
    })
    const box = await track.boundingBox()
    expect(box).not.toBeNull()
    const y = box!.y + box!.height / 2

    await page.mouse.move(box!.x + 90, y)
    await page.mouse.down()
    await page.mouse.move(box!.x + 120, y)
    await expect(thumb).toHaveAttribute('data-active', '')

    // Release over the document body.
    await page.mouse.move(500, 400)
    await page.mouse.up()
    await expect(thumb).not.toHaveAttribute('data-active')
    await expect(thumb).toBeFocused()
    expect(await page.evaluate(() => (window as any).__cap)).toEqual(['got', 'lost'])
    await expect(page.getByTestId('logged-ends')).toHaveText('[100]')

    // Later moves from the released pointer emit nothing.
    await page.mouse.move(box!.x + 240, y)
    await expect(page.getByTestId('logged-changes')).toHaveText('[30,40,100]')
  })
});
