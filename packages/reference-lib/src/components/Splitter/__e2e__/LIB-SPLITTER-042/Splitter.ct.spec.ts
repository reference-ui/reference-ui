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

test.describe('Splitter Enter collapse and restore', () => {
  test('SP-COMP-01: Collapsible sidebar resizes and restores in LTR and RTL', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Sidebar')
    const handle = page.getByTestId('sidebar-handle-0')

    const rootDisplay = await page.evaluate(
      () =>
        getComputedStyle(
          document.querySelector('[data-testid="test-splitter-sidebar"]') as HTMLElement
        ).display
    )
    expect(rootDisplay).toBe('flex')

    // LTR drag, collapse, and restore of the remembered size.
    const center = await handleCenter(page, 'sidebar-handle-0')
    await page.mouse.move(center.x, center.y)
    await page.mouse.down()
    await page.mouse.move(center.x + 40, center.y, { steps: 4 })
    await page.mouse.up()
    await expect(page.getByTestId('sidebar-value-display')).toHaveText('Layout: 40% / 60%')

    await handle.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('sidebar-value-display')).toHaveText('Layout: 5% / 95%')
    await expect(page.getByTestId('sidebar-panel-0')).toHaveAttribute('data-collapsed', '')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('sidebar-value-display')).toHaveText('Layout: 40% / 60%')
    await expect(page.getByTestId('sidebar-panel-0')).not.toHaveAttribute('data-collapsed', '')

    const ltrControls = await handle.getAttribute('aria-controls')
    const ltrPanelId = await page.getByTestId('sidebar-panel-0').getAttribute('id')
    expect(ltrControls).toBe(ltrPanelId)

    // RTL: the logical primary flips, physical drag reverses, memory holds.
    await mount('components/Splitter/Splitter/RtlSidebar')
    const rtlHandle = page.getByTestId('rtl-sidebar-handle-0')
    const rtlControls = await rtlHandle.getAttribute('aria-controls')
    const rtlPanelId = await page.getByTestId('rtl-sidebar-panel-1').getAttribute('id')
    expect(rtlControls).toBe(rtlPanelId)
    await expect(rtlHandle).toHaveAttribute('aria-valuenow', '70')

    const rtlCenter = await handleCenter(page, 'rtl-sidebar-handle-0')
    await page.mouse.move(rtlCenter.x, rtlCenter.y)
    await page.mouse.down()
    await page.mouse.move(rtlCenter.x + 40, rtlCenter.y, { steps: 4 })
    await page.mouse.up()
    await expect(page.getByTestId('rtl-sidebar-value-display')).toHaveText('Layout: 20% / 80%')

    await rtlHandle.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('rtl-sidebar-value-display')).toHaveText('Layout: 95% / 5%')
    await expect(page.getByTestId('rtl-sidebar-panel-1')).toHaveAttribute('data-collapsed', '')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('rtl-sidebar-value-display')).toHaveText('Layout: 20% / 80%')
    await expect(page.getByTestId('rtl-sidebar-panel-1')).not.toHaveAttribute(
      'data-collapsed',
      ''
    )
  })
})
