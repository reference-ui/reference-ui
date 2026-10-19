/**
 * Overlay exotica pass: cross-cutting edge cases beyond the main suite.
 * Covers document-scoped dismissal routing, sibling-root layer ordering,
 * deferred pointer sequences, restore-focus timing, branch reparenting,
 * and ShadowRoot isolation against the exotica fixtures.
 */
import { test, expect, snap } from '../../../../../playwright/ct'

test.describe('Overlay Exotica Pass', () => {
  test('OV-SCROLL-06: one-finger background scroll is locked; pinch is not canceled', async ({
    mount,
    page,
  }) => {
    await mount('components/Overlay/Overlay/Exotica')
    await expect(page.getByTestId('exotica-fixture-root')).toBeVisible()

    await page.getByTestId('btn-open-scroll-06').click()
    await expect(page.getByTestId('scroll-06-content')).toBeVisible()

    const flags = await page.evaluate(() => {
      const target = document.body
      const touch = (id: number, x: number, y: number) =>
        new Touch({ identifier: id, target, clientX: x, clientY: y })

      const one = new TouchEvent('touchmove', {
        bubbles: true,
        cancelable: true,
        composed: true,
        touches: [touch(1, 20, 40)],
        changedTouches: [touch(1, 20, 40)],
      })
      const start = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        composed: true,
        touches: [touch(1, 20, 10)],
        changedTouches: [touch(1, 20, 10)],
      })
      document.dispatchEvent(start)
      const onePrevented = !document.dispatchEvent(one)

      const pinchStart = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        composed: true,
        touches: [touch(1, 20, 20), touch(2, 40, 40)],
        changedTouches: [touch(1, 20, 20), touch(2, 40, 40)],
      })
      const pinch = new TouchEvent('touchmove', {
        bubbles: true,
        cancelable: true,
        composed: true,
        touches: [touch(1, 10, 10), touch(2, 60, 60)],
        changedTouches: [touch(1, 10, 10), touch(2, 60, 60)],
      })
      document.dispatchEvent(pinchStart)
      const pinchPrevented = !document.dispatchEvent(pinch)
      return { onePrevented, pinchPrevented }
    })

    expect(flags.onePrevented).toBe(true)
    expect(flags.pinchPrevented).toBe(false)
  })
})
