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

test.describe('Splitter FEATURES #4: CSS-variable geometry contract', () => {
  test('SP-DOM-13: Panels size from the variable with owned flex; Handles stay fixed', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Basic')

    const horizontal = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="test-splitter"]') as HTMLElement
      const panel = document.querySelector('[data-testid="splitter-panel-0"]') as HTMLElement
      const handle = document.querySelector('[data-testid="splitter-handle-0"]') as HTMLElement
      const cs = (el: HTMLElement) => getComputedStyle(el)
      return {
        rootDisplay: cs(root).display,
        rootDirection: cs(root).flexDirection,
        grow: cs(panel).flexGrow,
        shrink: cs(panel).flexShrink,
        basis: cs(panel).flexBasis,
        minWidth: cs(panel).minWidth,
        handleGrow: cs(handle).flexGrow,
        handleShrink: cs(handle).flexShrink,
        handleBasis: cs(handle).flexBasis,
        inlineFlex: panel.style.flex,
      }
    })
    expect(horizontal.rootDisplay).toBe('flex')
    expect(horizontal.rootDirection).toBe('row')
    expect(horizontal.grow).toBe('1')
    expect(horizontal.shrink).toBe('1')
    // flex-basis is the resolved 40% variable (percentages stay percentages
    // in computed style; layout resolves them against the flex container).
    expect(horizontal.basis).toBe('40%')
    expect(horizontal.minWidth).toBe('0px')
    expect(horizontal.handleGrow).toBe('0')
    expect(horizontal.handleShrink).toBe('0')
    expect(horizontal.handleBasis).toBe('auto')
    expect(horizontal.inlineFlex).toContain('var(--reference-splitter-panel-size)')

    await mount('components/Splitter/Splitter/Vertical')
    const vertical = await page.evaluate(() => {
      const panel = document.querySelector(
        '[data-testid="splitter-vertical-root"] [data-reference-splitter-panel]'
      ) as HTMLElement
      return {
        direction: getComputedStyle(panel.parentElement as HTMLElement).flexDirection,
        minHeight: getComputedStyle(panel).minHeight,
      }
    })
    expect(vertical.direction).toBe('column')
    expect(vertical.minHeight).toBe('0px')
  })
})
