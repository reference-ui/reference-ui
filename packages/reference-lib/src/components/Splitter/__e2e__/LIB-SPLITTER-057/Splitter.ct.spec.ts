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

test.describe('Splitter FEATURES #3/#8: measured constraints over the Panel-axis sum', () => {
  test('SP-COMP-02: Vertical editor/console honors measured console min on drag, keys, and bounds', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/MeasuredVertical')
    const handle = page.getByTestId('measured-v-handle-0')
    const display = page.getByTestId('measured-v-value-display')

    // Console min 120px of 500px Panel space caps the editor at 76.
    await expect(handle).toHaveAttribute('aria-valuenow', '70')
    await expect(handle).toHaveAttribute('aria-valuemin', '40')
    await expect(handle).toHaveAttribute('aria-valuemax', '76')
    await expect(handle).toHaveAttribute('aria-orientation', 'horizontal')
    const controls = await handle.getAttribute('aria-controls')
    expect(controls).toBe(await page.getByTestId('measured-v-panel-0').getAttribute('id'))
    const direction = await page.evaluate(
      () =>
        getComputedStyle(document.querySelector('[data-testid="test-splitter-measured-v"]') as HTMLElement)
          .flexDirection
    )
    expect(direction).toBe('column')

    // Shift+Arrow clamps at the measured bound through the same solver.
    await handle.focus()
    await page.keyboard.press('Shift+ArrowDown')
    await expect(page.getByTestId('measured-v-last-request')).toHaveText('76,24')
    await expect(display).toHaveText('Layout: 76% / 24%')

    await page.keyboard.press('Home')
    await expect(page.getByTestId('measured-v-last-request')).toHaveText('40,60')
    await page.keyboard.press('End')
    await expect(page.getByTestId('measured-v-last-request')).toHaveText('76,24')

    // Drag clamps at the same measured bound with the row cursor and no
    // selection leak.
    const at = await handleCenter(page, 'measured-v-handle-0')
    await page.mouse.move(at.x, at.y)
    await page.mouse.down()
    await page.mouse.move(at.x, at.y + 60, { steps: 6 })
    const during = await page.evaluate(() => ({
      cursor: document.body.style.cursor,
      userSelect: (document.body.style.getPropertyValue('user-select') || document.body.style.getPropertyValue('-webkit-user-select')),
    }))
    expect(during).toEqual({ cursor: 'row-resize', userSelect: 'none' })
    await page.mouse.up()
    await expect(page.getByTestId('measured-v-last-request')).toHaveText('76,24')
    const after = await page.evaluate(() => ({
      cursor: document.body.style.cursor,
      selection: window.getSelection()?.toString() ?? '',
    }))
    expect(after).toEqual({ cursor: '', selection: '' })
  })
})
