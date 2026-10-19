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
  test('SP-DOM-08: Feasible Handles tab in DOM order; explicit and infeasible Handles are aria-disabled but focusable', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Blocked')
    const first = page.getByTestId('blocked-handle-0')
    const second = page.getByTestId('blocked-handle-1')

    // Both feasible: tab stops in DOM order, no disabled semantics.
    await expect(first).toHaveAttribute('tabindex', '0')
    await expect(second).toHaveAttribute('tabindex', '0')
    await expect(first).not.toHaveAttribute('aria-disabled', 'true')
    await expect(second).not.toHaveAttribute('aria-disabled', 'true')
    await first.focus()
    await page.keyboard.press('Tab')
    const order = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(order).toBe('blocked-handle-1')

    // Disable one explicitly; pin the other's neighbors so no delta is feasible.
    await page.getByTestId('blocked-toggle-disabled').click()
    await page.getByTestId('blocked-toggle-pinned').click()

    // Focusable-but-inert: tab stops stay, action reports aria-disabled.
    await expect(first).toHaveAttribute('tabindex', '0')
    await expect(second).toHaveAttribute('tabindex', '0')
    await expect(first).toHaveAttribute('aria-disabled', 'true')
    await expect(second).toHaveAttribute('aria-disabled', 'true')
    await expect(first).toHaveAttribute('data-disabled', '')
    await expect(second).not.toHaveAttribute('data-disabled', '')

    // Neither requests resize on drag.
    const at = await handleCenter(page, 'blocked-handle-0')
    await page.mouse.move(at.x, at.y)
    await page.mouse.down()
    await page.mouse.move(at.x + 60, at.y, { steps: 4 })
    await page.mouse.up()
    const at2 = await handleCenter(page, 'blocked-handle-1')
    await page.mouse.move(at2.x, at2.y)
    await page.mouse.down()
    await page.mouse.move(at2.x - 60, at2.y, { steps: 4 })
    await page.mouse.up()
    await expect(page.getByTestId('blocked-change-count')).toHaveText('0')
    await expect(page.getByTestId('blocked-value-display')).toHaveText('Layout: 20% / 30% / 50%')

    // Tab order stays pinned in DOM order.
    await first.focus()
    await page.keyboard.press('Tab')
    const pinned = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(pinned).toBe('blocked-handle-1')
  })
})
