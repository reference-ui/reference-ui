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
  test('SP-PERF-07: Document session resources exist only while a pointer session is active', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Nested')

    // Idle stray moves reach no listener: nothing requests anywhere.
    await page.evaluate(() => {
      window.dispatchEvent(
        new PointerEvent('pointermove', {
          pointerId: 7,
          buttons: 1,
          clientX: 400,
          clientY: 240,
          bubbles: true,
          cancelable: true,
        })
      )
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7, bubbles: true }))
    })
    await expect(page.getByTestId('nested-inner-ends')).toHaveText('0')
    await expect(page.getByTestId('nested-outer-ends')).toHaveText('0')
    await expect(page.getByTestId('nested-sibling-ends')).toHaveText('0')

    // During the inner drag, only the inner instance holds document resources.
    const inner = await handleCenter(page, 'nested-inner-handle-0')
    await page.mouse.move(inner.x, inner.y)
    await page.mouse.down()
    await page.mouse.move(inner.x, inner.y + 24, { steps: 3 })
    const during = await page.evaluate(() => ({
      inner: document.querySelector('[data-testid="nested-inner"]')?.hasAttribute('data-resizing'),
      outer: document.querySelector('[data-testid="nested-outer"]')?.hasAttribute('data-resizing'),
      sibling: document.querySelector('[data-testid="nested-sibling"]')?.hasAttribute('data-resizing'),
      cursor: document.body.style.cursor,
      userSelect: (document.body.style.getPropertyValue('user-select') || document.body.style.getPropertyValue('-webkit-user-select')),
    }))
    expect(during).toEqual({
      inner: true,
      outer: false,
      sibling: false,
      cursor: 'row-resize',
      userSelect: 'none',
    })
    await page.mouse.up()

    // After release the document is clean and stray moves are inert again.
    const after = await page.evaluate(() => ({
      resizing: document.querySelectorAll('[data-resizing]').length,
      cursor: document.body.style.cursor,
      userSelect: (document.body.style.getPropertyValue('user-select') || document.body.style.getPropertyValue('-webkit-user-select')),
    }))
    expect(after).toEqual({ resizing: 0, cursor: '', userSelect: '' })
    await page.evaluate(() => {
      window.dispatchEvent(
        new PointerEvent('pointermove', {
          pointerId: 7,
          buttons: 1,
          clientX: 400,
          clientY: 240,
          bubbles: true,
          cancelable: true,
        })
      )
    })
    await expect(page.getByTestId('nested-inner-ends')).toHaveText('1')
    await expect(page.getByTestId('nested-outer-ends')).toHaveText('0')
    await expect(page.getByTestId('nested-sibling-ends')).toHaveText('0')
  })
})
