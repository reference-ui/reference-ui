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
  test('SP-ENV-03: A ShadowRoot Splitter keeps focus and drag cleanup inside its instance', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/ShadowHost')
    const handle = page.getByTestId('shadow-handle-0')
    await expect(handle).toBeVisible()

    // Focus lands in the shadow tree, not the light document.
    await handle.focus()
    const shadowFocus = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="shadow-host"]') as HTMLElement
      const shadow = host.shadowRoot!
      return {
        active: shadow.activeElement?.getAttribute('data-testid'),
        lightActive: document.activeElement?.getAttribute('data-testid'),
      }
    })
    expect(shadowFocus.active).toBe('shadow-handle-0')
    expect(shadowFocus.lightActive).toBe('shadow-host')

    // Drag from the shadow Handle to outside the host element.
    const at = await handleCenter(page, 'shadow-handle-0')
    const hostBox = await page.getByTestId('shadow-host').boundingBox()
    expect(hostBox).not.toBeNull()
    await page.mouse.move(at.x, at.y)
    await page.mouse.down()
    await page.mouse.move(hostBox!.x + hostBox!.width + 60, at.y + 40, { steps: 5 })
    await page.mouse.up()

    await expect(page.getByTestId('shadow-change-end-count')).toHaveText('1')
    const changes = await page.getByTestId('shadow-change-count').textContent()
    expect(Number(changes)).toBeGreaterThan(0)
    // Panel hooks inside the shadow tree followed the solver.
    const hook = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="shadow-host"]') as HTMLElement
      return (host.shadowRoot!.querySelector('[data-testid="shadow-panel-0"]') as HTMLElement).style
        .getPropertyValue('--reference-splitter-panel-size')
        .trim()
    })
    expect(hook).not.toBe('40%')
    expect(hook).toMatch(/^-?\d+(\.\d+)?%$/)

    // Cleanup belongs to the instance: shadow focus kept, document clean.
    const clean = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="shadow-host"]') as HTMLElement
      return {
        active: host.shadowRoot!.activeElement?.getAttribute('data-testid'),
        lightResizing: document.querySelectorAll('[data-resizing]').length,
        shadowResizing: host.shadowRoot!.querySelectorAll('[data-resizing]').length,
        cursor: document.body.style.cursor,
        userSelect: (document.body.style.getPropertyValue('user-select') || document.body.style.getPropertyValue('-webkit-user-select')),
      }
    })
    expect(clean).toMatchObject({
      active: 'shadow-handle-0',
      lightResizing: 0,
      shadowResizing: 0,
      cursor: '',
      userSelect: '',
    })
  })
})
