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
  test('SP-PERF-02: Pointermove reads no layout after the session captures geometry', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Constrained')
    const center = await handleCenter(page, 'constrained-handle-0')
    await recordNextPointerId(page, 'constrained-handle-0')

    await page.mouse.move(center.x, center.y)
    await page.mouse.down()
    await expect(page.getByTestId('test-splitter-constrained')).toHaveAttribute('data-resizing', '')
    const pointerId = await lastPointerId(page)

    // Spy the layout-read surface from here: moves must add zero calls.
    await page.evaluate(() => {
      const w = window as unknown as {
        __spReads: Record<string, number>
        __spOrig: Record<string, unknown>
      }
      w.__spReads = { rect: 0, computed: 0, offsetWidth: 0, offsetHeight: 0 }
      w.__spOrig = {}
      const origRect = Element.prototype.getBoundingClientRect
      w.__spOrig.rect = origRect
      Element.prototype.getBoundingClientRect = function (...args: []) {
        w.__spReads.rect += 1
        return (origRect as (...a: []) => DOMRect).apply(this, args)
      }
      const origComputed = window.getComputedStyle
      w.__spOrig.computed = origComputed
      window.getComputedStyle = ((...args: [Element]) => {
        w.__spReads.computed += 1
        return (origComputed as (...a: [Element]) => CSSStyleDeclaration)(...args)
      }) as typeof window.getComputedStyle
      for (const key of ['offsetWidth', 'offsetHeight'] as const) {
        let proto: object | null = HTMLElement.prototype
        while (proto && !Object.getOwnPropertyDescriptor(proto, key)) {
          proto = Object.getPrototypeOf(proto)
        }
        if (!proto) continue
        const desc = Object.getOwnPropertyDescriptor(proto, key) as PropertyDescriptor
        w.__spOrig[key] = desc
        Object.defineProperty(proto, key, {
          configurable: true,
          enumerable: desc.enumerable,
          get(this: HTMLElement) {
            w.__spReads[key] += 1
            return (desc.get as () => number).call(this)
          },
        })
      }
    })

    // Absolute-coordinate moves: the test itself reads no layout either.
    await page.evaluate(
      ({ pointerId, center }) => {
        for (let step = 1; step <= 20; step++) {
          window.dispatchEvent(
            new PointerEvent('pointermove', {
              pointerId,
              buttons: 1,
              clientX: center.x + step * 4,
              clientY: center.y,
              bubbles: true,
              cancelable: true,
            })
          )
        }
      },
      { pointerId, center }
    )
    const reads = await page.evaluate(
      () => (window as unknown as { __spReads: Record<string, number> }).__spReads
    )
    expect(reads).toEqual({ rect: 0, computed: 0, offsetWidth: 0, offsetHeight: 0 })

    await page.mouse.up()
  })
})
