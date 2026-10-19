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
  test('SP-END-04: Rejected requests report the last request to the latest handler', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Rejecting')

    // Hold a synthetic drag so the mouse stays free for mid-gesture swaps.
    await dispatchPointer(
      page,
      'rejecting-handle-0',
      'pointerdown',
      { pointerId: 7, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1 }
    )
    await page.getByTestId('rejecting-swap-constraints').click()
    await page.getByTestId('rejecting-swap-handler').click()
    await expect(page.getByTestId('rejecting-handler')).toHaveText('B')

    // Solved from the origin with the NEW maximum: 40 + 12.5 clamps to 50.
    await dispatchPointer(
      page,
      'rejecting-handle-0',
      'pointermove',
      { pointerId: 7, buttons: 1, dx: 50 },
      'window'
    )
    // Further motion past the bound is an exact no-op.
    await dispatchPointer(
      page,
      'rejecting-handle-0',
      'pointermove',
      { pointerId: 7, buttons: 1, dx: 100 },
      'window'
    )
    await dispatchPointer(
      page,
      'rejecting-handle-0',
      'pointermove',
      { pointerId: 7, buttons: 1, dx: 150 },
      'window'
    )
    await expect(page.getByTestId('rejecting-requests')).toHaveText('B:[50,50]')

    await dispatchPointer(
      page,
      'rejecting-handle-0',
      'pointerup',
      { pointerId: 7, buttons: 0, dx: 150 },
      'window'
    )
    // The end carries the last requested layout, not the controlled value.
    await expect(page.getByTestId('rejecting-ends')).toHaveText('B:[50,50]')
    await expect(page.getByTestId('rejecting-handle-0')).toHaveAttribute('aria-valuenow', '40')
  })
})
