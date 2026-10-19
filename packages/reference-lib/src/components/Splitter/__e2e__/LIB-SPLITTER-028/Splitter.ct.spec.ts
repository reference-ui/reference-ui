/**
 * Splitter composition gates and browser proofs. Pins panel/handle anatomy
 * and honest ARIA, keyboard and pointer resize sessions, Enter collapse
 * and restore with memory, RTL reversal, CSS-variable geometry, measured
 * constraints, controlled request shapes, pointer frame budgets, and
 * StrictMode and ShadowRoot behavior.
 */
import type { Page } from '@playwright/test'
import { test, expect, snap } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'

async function handleCenter(page: Page, testId: string) {
  const box = await page.getByTestId(testId).boundingBox()
  expect(box).not.toBeNull()
  return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 }
}

// Dispatch a synthetic PointerEvent: centered on the handle (plus dx/dy),
// or at absolute client coords via xy (mirrors a real drag, where the mouse
// stays put while the handle moves underneath it).
async function dispatchPointer(
  page: Page,
  testId: string,
  type: string,
  init: PointerEventInit & { dx?: number; dy?: number; xy?: { x: number; y: number } },
  target: 'handle' | 'window' = 'handle'
) {
  await page.evaluate(
    ({ testId, type, init, target }) => {
      const el = document.querySelector(`[data-testid="${testId}"]`) as HTMLElement
      const rect = el.getBoundingClientRect()
      const { dx, dy, xy, ...rest } = init as PointerEventInit & {
        dx?: number
        dy?: number
        xy?: { x: number; y: number }
      }
      const ev = new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: xy ? xy.x : rect.left + rect.width / 2 + (dx ?? 0),
        clientY: xy ? xy.y : rect.top + rect.height / 2 + (dy ?? 0),
        ...rest,
      })
      ;(target === 'window' ? window : el).dispatchEvent(ev)
    },
    { testId, type, init, target }
  )
}

// Dispatch a synthetic KeyboardEvent on the handle; resolves true when the
// event was NOT prevented (i.e. Splitter left it for the application).
async function dispatchKey(
  page: Page,
  testId: string,
  type: 'keydown' | 'keyup',
  init: KeyboardEventInit
): Promise<boolean> {
  return page.evaluate(
    ({ testId, type, init }) => {
      const el = document.querySelector(`[data-testid="${testId}"]`) as HTMLElement
      const { key, code, repeat, ctrlKey, metaKey, altKey, shiftKey } = init
      return el.dispatchEvent(
        new KeyboardEvent(type, {
          bubbles: true,
          cancelable: true,
          key,
          code,
          repeat,
          ctrlKey,
          metaKey,
          altKey,
          shiftKey,
        })
      )
    },
    { testId, type, init }
  )
}

// Record the next real pointerdown's pointerId on the handle.
async function recordNextPointerId(page: Page, testId: string) {
  await page.evaluate((testId) => {
    const el = document.querySelector(`[data-testid="${testId}"]`) as HTMLElement
    ;(window as unknown as { __spId: number | null }).__spId = null
    el.addEventListener(
      'pointerdown',
      (e: PointerEvent) => {
        ;(window as unknown as { __spId: number | null }).__spId = e.pointerId
      },
      { once: true }
    )
  }, testId)
}

async function lastPointerId(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __spId: number }).__spId)
}

test.describe('Splitter pointer-session robustness', () => {
  test('SP-DRAG-09: Cancel paths abort the drag with one cleanup and no end', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Constrained')

    const settled = () =>
      page.evaluate(() => ({
        resizing: document
          .querySelector('[data-testid="test-splitter-constrained"]')
          ?.hasAttribute('data-resizing'),
        userSelect: (document.body.style.getPropertyValue('user-select') || document.body.style.getPropertyValue('-webkit-user-select')),
        cursor: document.body.style.cursor,
      }))

    // (i) pointercancel after a changed request.
    await recordNextPointerId(page, 'constrained-handle-0')
    const a = await handleCenter(page, 'constrained-handle-0')
    await page.mouse.move(a.x, a.y)
    await page.mouse.down()
    await page.mouse.move(a.x + 40, a.y, { steps: 4 })
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 50% / 50%')
    await dispatchPointer(
      page,
      'constrained-handle-0',
      'pointercancel',
      { pointerId: await lastPointerId(page), buttons: 1 },
      'window'
    )
    expect(await settled()).toEqual({ resizing: false, userSelect: '', cursor: '' })
    await page.mouse.up()
    await expect(page.getByTestId('change-end-count')).toHaveText('0')
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 50% / 50%')

    // (ii) Lost capture aborts the same way. Only Chromium fires
    // lostpointercapture for an explicit releasePointerCapture (FF/WebKit
    // stay silent; implicit release fires everywhere), so the browser
    // signal itself is dispatched: Splitter's abort path is what's held.
    await recordNextPointerId(page, 'constrained-handle-0')
    const b = await handleCenter(page, 'constrained-handle-0')
    await page.mouse.move(b.x, b.y)
    await page.mouse.down()
    await page.mouse.move(b.x + 20, b.y, { steps: 2 })
    await page.evaluate(async () => {
      const el = document.querySelector('[data-testid="constrained-handle-0"]') as HTMLElement
      el.dispatchEvent(
        new PointerEvent('lostpointercapture', {
          pointerId: (window as unknown as { __spId: number }).__spId,
          bubbles: false,
          cancelable: false,
        })
      )
    })
    await expect(page.getByTestId('test-splitter-constrained')).not.toHaveAttribute(
      'data-resizing',
      ''
    )
    expect(await settled()).toEqual({ resizing: false, userSelect: '', cursor: '' })
    await page.mouse.up()
    await expect(page.getByTestId('change-end-count')).toHaveText('0')

    // (iii) A move with no buttons means the release was missed: abort.
    await recordNextPointerId(page, 'constrained-handle-0')
    const c = await handleCenter(page, 'constrained-handle-0')
    await page.mouse.move(c.x, c.y)
    await page.mouse.down()
    await dispatchPointer(
      page,
      'constrained-handle-0',
      'pointermove',
      { pointerId: await lastPointerId(page), buttons: 0, dx: 60 },
      'window'
    )
    expect(await settled()).toEqual({ resizing: false, userSelect: '', cursor: '' })
    await page.mouse.up()
    await expect(page.getByTestId('change-end-count')).toHaveText('0')

    // (iv) Window blur aborts the session.
    const d = await handleCenter(page, 'constrained-handle-0')
    await page.mouse.move(d.x, d.y)
    await page.mouse.down()
    await page.mouse.move(d.x + 20, d.y, { steps: 2 })
    await page.evaluate(() => window.dispatchEvent(new Event('blur')))
    expect(await settled()).toEqual({ resizing: false, userSelect: '', cursor: '' })
    await page.mouse.up()
    await expect(page.getByTestId('change-end-count')).toHaveText('0')
  })
})
