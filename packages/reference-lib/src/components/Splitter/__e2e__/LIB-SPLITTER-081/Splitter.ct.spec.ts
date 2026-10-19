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
  test('SP-DOM-11: Omitted collapsible/disabled default to plain resize; opt-in collapse resolves size 0', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/CollapseOptIn')

    const handle = page.getByTestId('optin-handle-0')
    await expect(handle).not.toHaveAttribute('aria-disabled', 'true')
    await handle.focus()

    // Omitted behavior props: Arrow resizes, Enter is not consumed.
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('optin-last-request')).toHaveText('51,49')
    await expect(page.getByTestId('optin-value-display')).toHaveText('Layout: 51% / 49%')
    const unprevented = await dispatchKey(page, 'optin-handle-0', 'keydown', { key: 'Enter' })
    expect(unprevented).toBe(true)
    await dispatchKey(page, 'optin-handle-0', 'keyup', { key: 'Enter' })
    await expect(page.getByTestId('optin-change-count')).toHaveText('1')
    await expect(page.getByTestId('optin-change-end-count')).toHaveText('1')

    // Opt the primary Panel in with collapsedSize still omitted: Enter
    // collapses to exactly 0.
    await page.getByTestId('optin-toggle-collapsible').click()
    await handle.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('optin-last-request')).toHaveText('0,100')
    await expect(page.getByTestId('optin-value-display')).toHaveText('Layout: 0% / 100%')
    await expect(page.getByTestId('optin-panel-0')).toHaveAttribute('data-collapsed', '')
  })
})
