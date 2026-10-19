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
  test('SP-DRAG-01: Primary pointerdown focuses, captures, and marks resizing before any move', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Constrained')
    const center = await handleCenter(page, 'constrained-handle-0')
    await recordNextPointerId(page, 'constrained-handle-0')

    await page.mouse.move(center.x, center.y)
    await page.mouse.down()
    // Read after the down round-trip (no moves issued): capture, focus, and
    // resizing hooks are all taken synchronously on pointerdown.
    const probe = await page.evaluate((pointerId: number) => {
      const el = document.querySelector('[data-testid="constrained-handle-0"]') as HTMLElement
      const root = document.querySelector(
        '[data-testid="test-splitter-constrained"]'
      ) as HTMLElement
      return {
        captured: el.hasPointerCapture(pointerId),
        focused: document.activeElement === el,
        rootResizing: root.hasAttribute('data-resizing'),
        handleResizing: el.hasAttribute('data-resizing'),
        panelsResizing: [...root.querySelectorAll('[data-reference-splitter-panel]')].every((p) =>
          p.hasAttribute('data-resizing')
        ),
      }
    }, await lastPointerId(page))
    expect(probe.captured).toBe(true)
    expect(probe.focused).toBe(true)
    expect(probe.rootResizing).toBe(true)
    expect(probe.handleResizing).toBe(true)
    expect(probe.panelsResizing).toBe(true)
    // No movement yet, so no callbacks have fired.
    await expect(page.getByTestId('change-count')).toHaveText('0')
    await expect(page.getByTestId('change-end-count')).toHaveText('0')

    await page.mouse.up()
    await expect(page.getByTestId('change-end-count')).toHaveText('0')
  })
})
