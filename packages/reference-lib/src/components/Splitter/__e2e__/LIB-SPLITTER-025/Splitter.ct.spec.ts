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
  test('SP-DRAG-06: Only primary button-0 input starts a session', async ({ mount, page }) => {
    await mount('components/Splitter/Splitter/Constrained')
    const center = await handleCenter(page, 'constrained-handle-0')

    // A primary pen drags exactly like a mouse.
    const pen = await handleCenter(page, 'constrained-handle-0')
    await dispatchPointer(
      page,
      'constrained-handle-0',
      'pointerdown',
      { pointerId: 7, pointerType: 'pen', isPrimary: true, button: 0, buttons: 1, xy: pen }
    )
    await dispatchPointer(
      page,
      'constrained-handle-0',
      'pointermove',
      { pointerId: 7, pointerType: 'pen', isPrimary: true, buttons: 1, xy: { x: pen.x + 40, y: pen.y } },
      'window'
    )
    await dispatchPointer(
      page,
      'constrained-handle-0',
      'pointerup',
      { pointerId: 7, pointerType: 'pen', isPrimary: true, buttons: 0, xy: { x: pen.x + 40, y: pen.y } },
      'window'
    )
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 50% / 50%')
    await expect(page.getByTestId('change-end-count')).toHaveText('1')

    // Mouse button 2 starts no state, capture, or callbacks.
    await page.mouse.move(center.x, center.y)
    await page.mouse.down({ button: 'right' })
    await page.waitForTimeout(100)
    await expect(page.getByTestId('test-splitter-constrained')).not.toHaveAttribute(
      'data-resizing',
      ''
    )
    await expect(page.getByTestId('change-count')).toHaveText('1')
    await expect(page.getByTestId('change-end-count')).toHaveText('1')
    await page.mouse.up({ button: 'right' })

    // A non-primary pointer and an auxiliary pen button are ignored.
    const silent = await page.evaluate(() => {
      const handle = document.querySelector('[data-testid="constrained-handle-0"]') as HTMLElement
      const root = document.querySelector(
        '[data-testid="test-splitter-constrained"]'
      ) as HTMLElement
      const rect = handle.getBoundingClientRect()
      const at = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }
      handle.dispatchEvent(
        new PointerEvent('pointerdown', {
          pointerId: 8,
          pointerType: 'touch',
          isPrimary: false,
          button: 0,
          buttons: 1,
          ...at,
          bubbles: true,
          cancelable: true,
        })
      )
      const afterNonPrimary = root.hasAttribute('data-resizing')
      handle.dispatchEvent(
        new PointerEvent('pointerdown', {
          pointerId: 9,
          pointerType: 'pen',
          isPrimary: true,
          button: 2,
          buttons: 2,
          ...at,
          bubbles: true,
          cancelable: true,
        })
      )
      return { afterNonPrimary, afterAux: root.hasAttribute('data-resizing') }
    })
    expect(silent.afterNonPrimary).toBe(false)
    expect(silent.afterAux).toBe(false)
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 50% / 50%')
    await expect(page.getByTestId('change-count')).toHaveText('1')
    await expect(page.getByTestId('change-end-count')).toHaveText('1')
  })
})
