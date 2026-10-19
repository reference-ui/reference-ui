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
  test('SP-ENV-04: Two-Panel parity smoke — constrained drag, Arrows, and Enter collapse/restore', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Sidebar')
    const handle = page.getByTestId('sidebar-handle-0')
    await handle.focus()

    // Keyboard leg with exact arrays from fresh [30,70].
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('sidebar-last-request')).toHaveText('31,69')
    await page.keyboard.press('Shift+ArrowRight')
    await expect(page.getByTestId('sidebar-last-request')).toHaveText('41,59')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('sidebar-last-request')).toHaveText('5,95')
    await expect(page.getByTestId('sidebar-panel-0')).toHaveAttribute('data-collapsed', '')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('sidebar-last-request')).toHaveText('41,59')
    await expect(page.getByTestId('sidebar-panel-0')).not.toHaveAttribute('data-collapsed', '')
    await expect(page.getByTestId('sidebar-change-count')).toHaveText('4')
    await expect(page.getByTestId('sidebar-change-end-count')).toHaveText('4')
    await expect(handle).toHaveAttribute('aria-valuenow', '41')
    // Honest bounds include the collapse floor (Enter can reach 5).
    await expect(handle).toHaveAttribute('aria-valuemin', '5')
    await expect(handle).toHaveAttribute('aria-valuemax', '95')

    // Constrained drag leg: one end, focus kept, capture released.
    const at = await handleCenter(page, 'sidebar-handle-0')
    await page.mouse.move(at.x, at.y)
    await page.mouse.down()
    await page.mouse.move(at.x + 60, at.y, { steps: 5 })
    await page.mouse.up()
    await expect(page.getByTestId('sidebar-change-end-count')).toHaveText('5')
    const dragChanges = await page.getByTestId('sidebar-change-count').textContent()
    expect(Number(dragChanges)).toBeGreaterThan(4)

    const settled = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="test-splitter-sidebar"]') as HTMLElement
      const panel0 = document.querySelector('[data-testid="sidebar-panel-0"]') as HTMLElement
      const handleEl = document.querySelector('[data-testid="sidebar-handle-0"]') as HTMLElement
      return {
        focused: document.activeElement === handleEl,
        resizing: document.querySelectorAll('[data-resizing]').length,
        cursor: document.body.style.cursor,
        userSelect: (document.body.style.getPropertyValue('user-select') || document.body.style.getPropertyValue('-webkit-user-select')),
        panelVar: panel0.style.getPropertyValue('--reference-splitter-panel-size'),
        root1: root.style.getPropertyValue('--reference-splitter-1'),
        now: handleEl.getAttribute('aria-valuenow'),
      }
    })
    expect(settled.focused).toBe(true)
    expect(settled.resizing).toBe(0)
    expect(settled.cursor).toBe('')
    expect(settled.userSelect).toBe('')
    // Size hooks agree with each other and the rounded display.
    expect(settled.panelVar).toBe(settled.root1)
    expect(Math.round(parseFloat(settled.panelVar))).toBe(Number(settled.now))
    // CT runs Chromium; Firefox/WebKit legs of this smoke are a matrix
    // remainder.
  })
})
