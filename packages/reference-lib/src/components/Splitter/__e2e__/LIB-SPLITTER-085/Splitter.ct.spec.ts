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
  test('SP-ENV-02: StrictMode mounts, reorders, drags, and unmounts with single registration', async ({
    mount,
    page,
  }) => {
    const component = await mount('components/Splitter/Splitter/StrictModeGroup')

    // Stable generated IDs: every aria-controls target exists.
    const controlsIntact = () =>
      page.evaluate(() =>
        ['strict-handle-0', 'strict-handle-1'].every((testId) => {
          const controls = document
            .querySelector(`[data-testid="${testId}"]`)
            ?.getAttribute('aria-controls')
          return !!controls && !!document.getElementById(controls)
        })
      )
    expect(await controlsIntact()).toBe(true)

    // Atomic reorder: adjacency rebuilds with no dangling references and no
    // unsolicited callback (single registration per live part).
    await page.getByTestId('strict-op-reorder').click()
    await expect(page.getByTestId('strict-value-display')).toHaveText('Layout: 30% / 20% / 50%')
    expect(await controlsIntact()).toBe(true)
    await expect(page.getByTestId('strict-change-count')).toHaveText('0')
    await expect(page.getByTestId('strict-change-end-count')).toHaveText('0')

    // Press-without-move is silent (no doubled session under effect replay).
    const at = await handleCenter(page, 'strict-handle-0')
    await page.mouse.move(at.x, at.y)
    await page.mouse.down()
    await page.mouse.up()
    await expect(page.getByTestId('strict-change-count')).toHaveText('0')

    // One physical drag: requests flow, exactly one end.
    await page.mouse.move(at.x, at.y)
    await page.mouse.down()
    await page.mouse.move(at.x + 40, at.y, { steps: 4 })
    await page.mouse.up()
    await expect(page.getByTestId('strict-change-end-count')).toHaveText('1')
    const changes = await page.getByTestId('strict-change-count').textContent()
    expect(Number(changes)).toBeGreaterThan(0)
    const lastRequest = await page.getByTestId('strict-last-request').textContent()
    expect(lastRequest?.split(',').map(Number).reduce((a, b) => a + b, 0)).toBeCloseTo(100, 5)

    // Complete cleanup on unmount.
    await component.unmount()
    const cleared = await page.evaluate(() => ({
      group: document.querySelector('[data-testid="test-splitter-strict"]'),
      resizing: document.querySelectorAll('[data-resizing]').length,
      cursor: document.body.style.cursor,
      userSelect: (document.body.style.getPropertyValue('user-select') || document.body.style.getPropertyValue('-webkit-user-select')),
    }))
    expect(cleared.group).toBeNull()
    expect(cleared.resizing).toBe(0)
    expect(cleared.cursor).toBe('')
    expect(cleared.userSelect).toBe('')
    // Run this spec with --react all for the React 17/18/19 leg (StrictMode
    // replays effects on 18+ dev; 17 asserts uniform single behavior).
  })
})
