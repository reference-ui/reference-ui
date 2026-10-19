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
  test('SD-END-03: stays silent when a changed session is canceled or invalidated', async ({
    mount,
    page,
  }) => {
    // Synthetic cancel events through real handlers (disable and
    // lostpointercapture are pinned with real triggers in SD-POINTER-08).
    for (const kind of ['pointercancel', 'buttons-zero', 'window-blur'] as const) {
      const component = await mount('components/Slider/Slider/LoggedFixture', {
        initial: 20,
        width: 300,
      })
      await page.evaluate(() => {
        ;(window as any).__capId = null
        document
          .querySelector('[data-testid="logged-track"]')!
          .addEventListener('gotpointercapture', (e: Event) => {
            ;(window as any).__capId = (e as PointerEvent).pointerId
          })
      })
      const track = page.getByTestId('logged-track')
      const box = await track.boundingBox()
      await page.mouse.move(box!.x + 120, box!.y + box!.height / 2)
      await page.mouse.down()
      // 1px flush move (40 -> 40.33, snaps to 40, no log
      // entry) — FF/WebKit deliver `gotpointercapture` only on the next input
      // event (see SD-POINTER-04). Ownership
      // itself is real at down-time; the poll below is unchanged.
      await page.mouse.move(box!.x + 121, box!.y + box!.height / 2)
      await expect(page.getByTestId('logged-changes')).toHaveText('[40]')
      await expect.poll(() => page.evaluate(() => (window as any).__capId)).not.toBeNull()

      if (kind === 'pointercancel') {
        await page.evaluate(() => {
          window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: (window as any).__capId }))
        })
      } else if (kind === 'buttons-zero') {
        await page.evaluate(() => {
          window.dispatchEvent(
            new PointerEvent('pointermove', { pointerId: (window as any).__capId, buttons: 0 })
          )
        })
      } else {
        await page.evaluate(() => {
          window.dispatchEvent(new Event('blur'))
        })
      }
      await page.mouse.move(box!.x + 240, box!.y + box!.height / 2)
      await page.mouse.up()
      await expect(page.getByTestId('logged-changes')).toHaveText('[40]')
      await expect(page.getByTestId('logged-ends')).toHaveText('[]')
      await expect(page.getByTestId('logged-thumb-0')).not.toHaveAttribute('data-active')
      await component.unmount()
    }

    // Real thumb removal mid-drag cancels without an end report.
    const card = await mount('components/Slider/Slider/CardinalityFixture')
    let tbox = await page.getByTestId('cardinality-thumb-2').boundingBox()
    await page.mouse.move(tbox!.x + tbox!.width / 2, tbox!.y + tbox!.height / 2)
    await page.mouse.down()
    await page.evaluate(() => {
      ;(document.querySelector('[data-testid="cardinality-shrink"]') as HTMLElement).click()
    })
    await page.mouse.up()
    await expect(page.getByTestId('cardinality-ends')).toHaveText('[]')
    await card.unmount()

    // Real unmount mid-drag: no error, no end; a remount works.
    const dying = await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 300 })
    const dtrack = page.getByTestId('logged-track')
    const dbox = await dtrack.boundingBox()
    await page.mouse.move(dbox!.x + 120, dbox!.y + dbox!.height / 2)
    await page.mouse.down()
    await expect(page.getByTestId('logged-changes')).toHaveText('[40]')
    await dying.unmount()
    await page.mouse.move(dbox!.x + 200, dbox!.y + dbox!.height / 2)
    await page.mouse.up()
    await expect(page.getByTestId('logged-track')).toHaveCount(0)
    await mount('components/Slider/Slider/LoggedFixture', { initial: 20, width: 300 })
    await expect(page.getByTestId('logged-thumb-0')).toBeVisible()

    // Keyboard sessions invalidated before keyup stay silent.
    for (const kind of ['blur', 'disable'] as const) {
      const component = await mount('components/Slider/Slider/LoggedFixture', {
        initial: 20,
        width: 300,
      })
      const thumb = page.getByTestId('logged-thumb-0')
      await thumb.focus()
      await page.keyboard.down('ArrowRight')
      await expect(page.getByTestId('logged-changes')).toHaveText('[21]')
      if (kind === 'blur') {
        await page.evaluate(() => {
          ;(document.querySelector('[data-testid="logged-thumb-0"]') as HTMLElement).blur()
        })
      } else {
        // Same-story remount preserves state but flips props: a true disable.
        await mount('components/Slider/Slider/LoggedFixture', {
          initial: 20,
          width: 300,
          disabled: true,
        })
        await expect(page.getByTestId('logged-thumb-0')).toHaveAttribute('tabindex', '-1')
      }
      await page.keyboard.up('ArrowRight')
      await expect(page.getByTestId('logged-ends')).toHaveText('[]')
      await component.unmount()
    }
  })
});
