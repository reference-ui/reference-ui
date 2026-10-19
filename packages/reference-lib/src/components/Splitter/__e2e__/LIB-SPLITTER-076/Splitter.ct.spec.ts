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

test.describe('Splitter controlled sessions and compositions', () => {
  test('SP-COMP-04: An inner CSS grid reflows with its Panel while Splitter writes no grid signal', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/InnerGrid')

    const measure = () =>
      page.evaluate(() => {
        const grid = document.querySelector('[data-testid="innergrid-grid"]') as HTMLElement
        const cell0 = document.querySelector('[data-testid="innergrid-cell-0"]') as HTMLElement
        const cell1 = document.querySelector('[data-testid="innergrid-cell-1"]') as HTMLElement
        const root = document.querySelector('[data-testid="test-splitter-innergrid"]') as HTMLElement
        const panel = document.querySelector('[data-testid="innergrid-panel-1"]') as HTMLElement
        return {
          gridWidth: grid.getBoundingClientRect().width,
          cell0: cell0.getBoundingClientRect().width,
          cell1: cell1.getBoundingClientRect().width,
          panelWidth: panel.clientWidth,
          rootStyle: root.getAttribute('style') ?? '',
          panelStyle: panel.getAttribute('style') ?? '',
        }
      })

    const before = await measure()
    expect(before.rootStyle).not.toContain('grid-template')
    expect(before.panelStyle).not.toContain('grid-template')

    const at = await handleCenter(page, 'innergrid-handle-0')
    await page.mouse.move(at.x, at.y)
    await page.mouse.down()
    await page.mouse.move(at.x - 80, at.y, { steps: 5 })
    await page.mouse.up()
    await expect(page.getByTestId('innergrid-value-display')).toHaveText('Layout: 20% / 80%')

    const after = await measure()
    // Both tracks scale with the Panel and keep their 1:2 ratio; the grid's
    // used width matches the Panel; Splitter wrote no grid signal.
    expect(after.cell0).toBeGreaterThan(before.cell0 + 10)
    expect(after.cell1).toBeGreaterThan(before.cell1 + 10)
    expect(after.cell1 / after.cell0).toBeCloseTo(2, 0)
    expect(Math.abs(after.gridWidth - after.panelWidth)).toBeLessThanOrEqual(1)
    expect(after.rootStyle).not.toContain('grid-template')
    expect(after.panelStyle).not.toContain('grid-template')
  })
})
