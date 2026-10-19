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

test.describe('Splitter FEATURES #5: pointer-session frame budget', () => {
  test('SP-PERF-04: Changed moves write CSS size signals synchronously, ahead of the delayed value', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/DelayedEcho')
    const center = await handleCenter(page, 'delayed-handle-0')
    await recordNextPointerId(page, 'delayed-handle-0')

    await page.mouse.move(center.x, center.y)
    await page.mouse.down()
    const pointerId = await lastPointerId(page)

    // Dispatch and read inside one turn: the ref write lands before rAF.
    const seen = await page.evaluate(
      ({ pointerId, center }) => {
        window.dispatchEvent(
          new PointerEvent('pointermove', {
            pointerId,
            buttons: 1,
            clientX: center.x + 50,
            clientY: center.y,
            bubbles: true,
            cancelable: true,
          })
        )
        const root = document.querySelector('[data-testid="test-splitter-delayed"]') as HTMLElement
        const panels = [...root.querySelectorAll('[data-reference-splitter-panel]')] as HTMLElement[]
        return {
          panel0: panels[0]?.style.getPropertyValue('--reference-splitter-panel-size'),
          panel1: panels[1]?.style.getPropertyValue('--reference-splitter-panel-size'),
          root1: root.style.getPropertyValue('--reference-splitter-1'),
          display: document.querySelector('[data-testid="delayed-value-display"]')?.textContent,
        }
      },
      { pointerId, center }
    )
    // Thousandths differ per engine (Chromium keeps a fractional real-mouse
    // origin; FF/WebKit round it to whole px against the same float
    // synthetic move): the contract is the synchronous write, held ±0.05.
    expect(parseFloat(seen.panel0 ?? '')).toBeCloseTo(52.531, 1)
    expect(parseFloat(seen.panel1 ?? '')).toBeCloseTo(47.469, 1)
    expect(parseFloat(seen.root1 ?? '')).toBeCloseTo(52.531, 1)
    expect(seen.display).toContain('Layout: 40% / 60%')

    // Lift where the gesture finished: release re-solves at the lift point,
    // so lifting at the untouched origin would end at [40,60].
    await page.mouse.move(center.x + 50, center.y)
    await page.mouse.up()
    const ends = (await page.getByTestId('delayed-ends').innerText()).split(',').map(Number)
    expect(ends[0]).toBeCloseTo(52.531, 1)
    expect(ends[1]).toBeCloseTo(47.469, 1)
  })
})
