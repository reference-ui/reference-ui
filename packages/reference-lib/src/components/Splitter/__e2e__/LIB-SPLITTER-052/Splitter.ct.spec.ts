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
  test('SP-DOM-12: Root indexed signals follow Panel order while Panel vars travel with their Panel', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Dynamic')

    const vars = () =>
      page.evaluate(() => {
        const root = document.querySelector('[data-testid="test-splitter-dynamic"]') as HTMLElement
        const byId = (id: string) =>
          (document.querySelector(`[data-testid="dynamic-panel-${id}"]`) as HTMLElement)?.style.getPropertyValue(
            '--reference-splitter-panel-size'
          )
        return {
          root1: root.style.getPropertyValue('--reference-splitter-1'),
          root2: root.style.getPropertyValue('--reference-splitter-2'),
          root3: root.style.getPropertyValue('--reference-splitter-3'),
          a: byId('a'),
          b: byId('b'),
          c: byId('c'),
        }
      })

    expect(await vars()).toMatchObject({
      root1: '30%',
      root2: '35%',
      root3: '35%',
      a: '30%',
      b: '35%',
      c: '35%',
    })

    // Collapse A, then atomically reorder to B/A/C with matching values.
    await page.getByTestId('dynamic-handle-0').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('dynamic-last-request')).toHaveText('5,60,35')
    await page.getByTestId('dynamic-op-reorder').click()

    // Indexed Root signals follow the new order; A's own var travels with A.
    expect(await vars()).toMatchObject({
      root1: '60%',
      root2: '5%',
      root3: '35%',
      a: '5%',
      b: '60%',
      c: '35%',
    })
  })
})
