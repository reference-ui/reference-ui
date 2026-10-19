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
  test('SP-DOM-06: State hooks update while authored classes and styles stay exact', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/StyledHooks')

    // The kernel-owned cursor class legitimately flips with blocked state
    // (bound-appropriate cursor); it is stripped so the comparison pins only
    // unrelated authored classes. The app tokens are asserted separately.
    const authored = () =>
      page.evaluate(() => {
        const root = document.querySelector('[data-testid="test-splitter-styled"]') as HTMLElement
        const panel0 = document.querySelector('[data-testid="styled-panel-0"]') as HTMLElement
        const panel1 = document.querySelector('[data-testid="styled-panel-1"]') as HTMLElement
        const handle = document.querySelector('[data-testid="styled-handle-0"]') as HTMLElement
        const stripCursor = (className: string) => className.replace(/reference-ui__cursor_\S+/g, '')
        return {
          rootClass: stripCursor(root.className),
          rootTransform: root.style.transform,
          rootGrid: root.style.gridAutoFlow,
          panelClass: stripCursor(panel0.className),
          panelTransform: panel0.style.transform,
          panelFlexWrap: panel0.style.flexWrap,
          panelAccent: panel0.style.getPropertyValue('--app-accent'),
          panel1Accent: panel1.style.getPropertyValue('--app-accent'),
          handleClass: stripCursor(handle.className),
          handleTransform: handle.style.transform,
          appTokens:
            root.className.includes('app-root-hooks') &&
            panel0.className.includes('app-panel-hooks') &&
            handle.className.includes('app-handle-hooks'),
        }
      })
    const resizing = () =>
      page.evaluate(() => ({
        root: document.querySelector('[data-testid="test-splitter-styled"]')?.hasAttribute('data-resizing'),
        panel0: document.querySelector('[data-testid="styled-panel-0"]')?.hasAttribute('data-resizing'),
        handle: document.querySelector('[data-testid="styled-handle-0"]')?.hasAttribute('data-resizing'),
      }))

    const baseline = await authored()
    expect(baseline.rootClass).toContain('app-root-hooks')
    expect(baseline.panelClass).toContain('app-panel-hooks')
    expect(baseline.handleClass).toContain('app-handle-hooks')
    expect(baseline).toMatchObject({
      rootTransform: 'translateX(0px)',
      rootGrid: 'row',
      panelTransform: 'translateZ(0px)',
      panelFlexWrap: 'nowrap',
      panelAccent: 'hotpink',
      panel1Accent: 'hotpink',
      handleTransform: 'translateZ(0px)',
    })

    // Drag: resizing hooks appear on Root, Panels, and Handle, then clear.
    const at = await handleCenter(page, 'styled-handle-0')
    await page.mouse.move(at.x, at.y)
    await page.mouse.down()
    expect(await resizing()).toEqual({ root: true, panel0: true, handle: true })
    await page.mouse.move(at.x + 40, at.y, { steps: 4 })
    await page.mouse.up()
    expect(await resizing()).toEqual({ root: false, panel0: false, handle: false })
    await expect(page.getByTestId('styled-change-end-count')).toHaveText('1')
    expect(await authored()).toEqual(baseline)

    // Collapse: the collapsed hook lands on the Panel only.
    await page.getByTestId('styled-handle-0').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('styled-last-request')).toHaveText(/^5,/)
    await expect(page.getByTestId('styled-panel-0')).toHaveAttribute('data-collapsed', '')
    await expect(page.getByTestId('styled-panel-1')).not.toHaveAttribute('data-collapsed', '')
    expect(await authored()).toEqual(baseline)

    // Disable: the disabled hook lands on the Handle only.
    await page.getByTestId('styled-toggle-disabled').click()
    await expect(page.getByTestId('styled-handle-0')).toHaveAttribute('data-disabled', '')
    await expect(page.getByTestId('styled-handle-0')).toHaveAttribute('aria-disabled', 'true')
    expect(await authored()).toEqual(baseline)
  })
})
