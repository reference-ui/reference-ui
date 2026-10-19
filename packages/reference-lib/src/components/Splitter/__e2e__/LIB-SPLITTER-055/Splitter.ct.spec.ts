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

test.describe('Splitter FEATURES #7: Handle determinism', () => {
  test('SP-KEY-06: Disabled and blocked Handles consume no resize key', async ({ mount, page }) => {
    await mount('components/Splitter/Splitter/Blocked')
    await page.getByTestId('blocked-toggle-disabled').click()
    await page.getByTestId('blocked-toggle-pinned').click()

    for (const testId of ['blocked-handle-0', 'blocked-handle-1']) {
      await page.getByTestId(testId).focus()
      for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End', 'Enter']) {
        const unprevented = await dispatchKey(page, testId, 'keydown', { key })
        expect(unprevented).toBe(true)
      }
      await dispatchKey(page, testId, 'keyup', { key: 'ArrowRight' })
      // Focus never leaves; nothing changed.
      const focused = await page.evaluate(
        (id) => document.activeElement?.getAttribute('data-testid') === id,
        testId
      )
      expect(focused).toBe(true)
    }
    await expect(page.getByTestId('blocked-change-count')).toHaveText('0')
    await expect(page.getByTestId('blocked-change-end-count')).toHaveText('0')
    await expect(page.getByTestId('blocked-value-display')).toHaveText('Layout: 20% / 30% / 50%')
    await expect(page.getByTestId('blocked-handle-0')).toHaveAttribute('aria-valuenow', '20')
    await expect(page.getByTestId('blocked-handle-1')).toHaveAttribute('aria-valuenow', '30')
  })
})
