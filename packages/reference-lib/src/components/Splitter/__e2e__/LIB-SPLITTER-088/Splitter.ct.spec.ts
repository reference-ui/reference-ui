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

test.describe('Splitter DOM, keyboard, and environment CT', () => {
  test('FEATURES #11: Invisible hit area widens the pointer target while visuals stay 9px', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Basic')

    const geometry = await page.evaluate(() => {
      const handle = document.querySelector('[data-testid="splitter-handle-0"]') as HTMLElement
      const line = handle.querySelector('[data-reference-splitter-handle-line]') as HTMLElement
      const rect = handle.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const hit = (x: number, y: number) =>
        (document.elementFromPoint(x, y) as HTMLElement | null)?.closest(
          '[data-testid="splitter-handle-0"]'
        ) != null
      const panel = (x: number, y: number) =>
        (document.elementFromPoint(x, y) as HTMLElement | null)?.closest(
          '[data-reference-splitter-panel]'
        ) != null
      return {
        handleWidth: getComputedStyle(handle).width,
        lineWidth: getComputedStyle(line).width,
        farOutsideLeftHitsPanel: panel(cx - 16, cy),
        stripLeftHitsHandle: hit(cx - 10, cy),
        stripRightHitsHandle: hit(cx + 10, cy),
        farOutsideRightHitsPanel: panel(cx + 16, cy),
      }
    })
    // Visuals unchanged: 9px Handle, 1px line.
    expect(geometry.handleWidth).toBe('9px')
    expect(geometry.lineWidth).toBe('1px')
    // The invisible strip (±12.5px) answers inside the 9px box's reach.
    expect(geometry.stripLeftHitsHandle).toBe(true)
    expect(geometry.stripRightHitsHandle).toBe(true)
    // Beyond the strip, neighboring content still wins.
    expect(geometry.farOutsideLeftHitsPanel).toBe(true)
    expect(geometry.farOutsideRightHitsPanel).toBe(true)

    await mount('components/Splitter/Splitter/Vertical')
    const vertical = await page.evaluate(() => {
      const handle = document.querySelector(
        '[data-testid="splitter-vertical-handle"]'
      ) as HTMLElement
      const rect = handle.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const hit = (x: number, y: number) =>
        (document.elementFromPoint(x, y) as HTMLElement | null)?.closest(
          '[data-testid="splitter-vertical-handle"]'
        ) != null
      return {
        handleHeight: getComputedStyle(handle).height,
        stripAboveHitsHandle: hit(cx, cy - 10),
        stripBelowHitsHandle: hit(cx, cy + 10),
      }
    })
    expect(vertical.handleHeight).toBe('9px')
    expect(vertical.stripAboveHitsHandle).toBe(true)
    expect(vertical.stripBelowHitsHandle).toBe(true)
  })
})
