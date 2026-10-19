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
  test('SP-CTRL-03: Programmatic values update hooks and ARIA on the same nodes with focus kept', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Dynamic')
    const handle = page.getByTestId('dynamic-handle-0')
    await handle.focus()

    await page.evaluate(() => {
      const w = window as unknown as {
        __spNodes?: Record<string, Element | null>
        __spStray?: number
      }
      w.__spNodes = {
        root: document.querySelector('[data-testid="test-splitter-dynamic"]'),
        panelA: document.querySelector('[data-testid="dynamic-panel-a"]'),
        handle0: document.querySelector('[data-testid="dynamic-handle-0"]'),
      }
      w.__spStray = 0
      const count = () => {
        w.__spStray = (w.__spStray ?? 0) + 1
      }
      document
        .querySelector('[data-testid="test-splitter-dynamic"]')
        ?.addEventListener('pointerdown', count, true)
      document
        .querySelector('[data-testid="test-splitter-dynamic"]')
        ?.addEventListener('keydown', count, true)
    })

    // Programmatic rerender without stealing focus.
    await page.evaluate(() =>
      (document.querySelector('[data-testid="dynamic-op-programmatic"]') as HTMLElement).click()
    )
    await expect(page.getByTestId('dynamic-value-display')).toHaveText('Layout: 5% / 60% / 35%')

    const after = await page.evaluate(() => {
      const w = window as unknown as {
        __spNodes: Record<string, Element | null>
        __spStray: number
      }
      const panelA = document.querySelector('[data-testid="dynamic-panel-a"]') as HTMLElement
      const handle0 = document.querySelector('[data-testid="dynamic-handle-0"]') as HTMLElement
      const now = Number(handle0.getAttribute('aria-valuenow'))
      return {
        sameRoot:
          w.__spNodes.root === document.querySelector('[data-testid="test-splitter-dynamic"]'),
        samePanelA: w.__spNodes.panelA === panelA,
        sameHandle: w.__spNodes.handle0 === handle0,
        panelVar: panelA.style.getPropertyValue('--reference-splitter-panel-size'),
        collapsed: panelA.hasAttribute('data-collapsed'),
        now,
        min: Number(handle0.getAttribute('aria-valuemin')),
        max: Number(handle0.getAttribute('aria-valuemax')),
        focused: document.activeElement === handle0,
        stray: w.__spStray,
      }
    })
    expect(after.sameRoot).toBe(true)
    expect(after.samePanelA).toBe(true)
    expect(after.sameHandle).toBe(true)
    expect(after.panelVar).toBe('5%')
    expect(after.collapsed).toBe(true)
    expect(after.now).toBe(5)
    expect(after.min).toBeLessThanOrEqual(5)
    expect(after.max).toBeGreaterThanOrEqual(5)
    expect(after.focused).toBe(true)
    expect(after.stray).toBe(0)
    await expect(page.getByTestId('dynamic-change-count')).toHaveText('0')
    await expect(page.getByTestId('dynamic-change-end-count')).toHaveText('0')
  })
})
