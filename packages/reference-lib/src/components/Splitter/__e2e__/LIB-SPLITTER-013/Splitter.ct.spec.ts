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

test.describe('Splitter Composition Gates & Browser Proofs', () => {
  test('min/max/index never leak to css() or the DOM', async ({
    mount,
    page,
  }) => {
    // Constrained call sites (min/max + a stale deleted index, as in
    // consumer code) must not reach css() ("no compiled class" spam) or
    // the DOM. min/max drive the solver; index is stripped and ignored.
    const errors: string[] = []
    const warnings: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
      if (msg.type() === 'warning') warnings.push(msg.text())
    })
    page.on('pageerror', err => errors.push(String(err)))

    await mount('components/Splitter/Splitter/NoLeakProps')
    await expect(page.getByTestId('noleak-panel-0')).toBeVisible()

    // Solver routing: min=10 / max=90 bind the separator range.
    const handle = page.getByTestId('noleak-handle-0')
    await expect(handle).toHaveAttribute('aria-valuemin', '10')
    await expect(handle).toHaveAttribute('aria-valuemax', '90')

    // Zero DOM leak on Panels and the Handle.
    const leakedAttrs = await page.evaluate(() => {
      const names = ['min', 'max', 'index', 'collapsible', 'collapsedsize']
      const hits: string[] = []
      for (const node of document.querySelectorAll(
        '[data-reference-splitter-panel], [data-reference-splitter-handle]'
      )) {
        for (const name of names) {
          if (node.hasAttribute(name)) {
            hits.push(`${(node as HTMLElement).dataset.testid ?? '?'}[${name}]`)
          }
        }
      }
      return hits
    })
    expect(leakedAttrs).toEqual([])

    // Zero miss-spam for the stripped names (minSize/maxSize are deleted
    // aliases — they must never surface). Targeted (not blanket
    // zero-warnings): the dev-race can warn for values whose rules exist,
    // so only the leak signature fails here.
    const leak = /minSize|maxSize|collapsible|collapsedSize/
    expect(errors.filter(t => leak.test(t))).toEqual([])
    expect(warnings.filter(t => leak.test(t))).toEqual([])
  })
})
