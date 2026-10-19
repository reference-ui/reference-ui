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

test.describe('Splitter FEATURES #3/#8: measured constraints over the Panel-axis sum', () => {
  test('SP-DRAG-03: Vertical drag maps to the Panel above identically in LTR and RTL', async ({
    mount,
    page,
  }) => {
    // Same-story mounts reconcile onto one root and keep state, so each
    // run unmounts first for a fresh [70,30].
    const run1 = await mount('components/Splitter/Splitter/MeasuredVertical')
    const down = await handleCenter(page, 'measured-v-handle-0')
    await page.mouse.move(down.x, down.y)
    await page.mouse.down()
    await page.mouse.move(down.x, down.y + 50, { steps: 4 })
    await page.mouse.up()
    await expect(page.getByTestId('measured-v-last-request')).toHaveText('76,24')
    await run1.unmount()

    const run2 = await mount('components/Splitter/Splitter/MeasuredVertical')
    const up = await handleCenter(page, 'measured-v-handle-0')
    await page.mouse.move(up.x, up.y)
    await page.mouse.down()
    await page.mouse.move(up.x, up.y - 50, { steps: 4 })
    await page.mouse.up()
    await expect(page.getByTestId('measured-v-last-request')).toHaveText('60,40')
    await run2.unmount()

    // RTL changes nothing vertically: same mapping, above Panel primary.
    await mount('components/Splitter/Splitter/MeasuredVertical')
    await page.evaluate(() => {
      document.dir = 'rtl'
    })
    try {
      const rtl = await handleCenter(page, 'measured-v-handle-0')
      await page.mouse.move(rtl.x, rtl.y)
      await page.mouse.down()
      await page.mouse.move(rtl.x, rtl.y + 50, { steps: 4 })
      await page.mouse.up()
      await expect(page.getByTestId('measured-v-last-request')).toHaveText('76,24')
      await expect(page.getByTestId('measured-v-handle-0')).toHaveAttribute(
        'aria-orientation',
        'horizontal'
      )
      const controls = await page.getByTestId('measured-v-handle-0').getAttribute('aria-controls')
      expect(controls).toBe(await page.getByTestId('measured-v-panel-0').getAttribute('id'))
    } finally {
      await page.evaluate(() => {
        document.dir = ''
      })
    }
  })
})
