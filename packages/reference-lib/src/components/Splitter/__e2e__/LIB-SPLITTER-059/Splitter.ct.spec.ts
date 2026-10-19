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

test.describe('Splitter FEATURES #6: collapse memory and dynamic panels', () => {
  test('SP-COLLAPSE-05: Programmatic value changes cross the collapse boundary silently', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Dynamic')
    const handle = page.getByTestId('dynamic-handle-0')
    await handle.focus()

    // Programmatic clicks (no focus steal) so focus retention is meaningful.
    const toggleProgrammatic = () =>
      page.evaluate(() =>
        (document.querySelector('[data-testid="dynamic-op-programmatic"]') as HTMLElement).click()
      )
    await toggleProgrammatic()
    await expect(page.getByTestId('dynamic-value-display')).toHaveText('Layout: 5% / 60% / 35%')
    await expect(page.getByTestId('dynamic-panel-a')).toHaveAttribute('data-collapsed', '')
    await expect(handle).toHaveAttribute('aria-valuenow', '5')
    await expect(page.getByTestId('dynamic-change-count')).toHaveText('0')
    await expect(page.getByTestId('dynamic-change-end-count')).toHaveText('0')
    const focused = await page.evaluate(
      () => document.activeElement?.getAttribute('data-testid') === 'dynamic-handle-0'
    )
    expect(focused).toBe(true)

    await toggleProgrammatic()
    await expect(page.getByTestId('dynamic-value-display')).toHaveText('Layout: 30% / 35% / 35%')
    await expect(page.getByTestId('dynamic-panel-a')).not.toHaveAttribute('data-collapsed', '')
    await expect(page.getByTestId('dynamic-change-count')).toHaveText('0')
  })
})
