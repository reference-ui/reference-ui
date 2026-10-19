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

test.describe('Splitter pointer-session robustness', () => {
  test('SP-DRAG-09: Disable, handle removal, and unmount abort the drag', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Lifecycle')

    const settled = () =>
      page.evaluate(() => ({
        resizing: document
          .querySelector('[data-testid="test-splitter-lifecycle"]')
          ?.hasAttribute('data-resizing'),
        userSelect: (document.body.style.getPropertyValue('user-select') || document.body.style.getPropertyValue('-webkit-user-select')),
        cursor: document.body.style.cursor,
      }))

    // Disable mid-drag cancels the owned session.
    const a = await handleCenter(page, 'lifecycle-handle-0')
    await page.mouse.move(a.x, a.y)
    await page.mouse.down()
    await page.mouse.move(a.x + 40, a.y, { steps: 4 })
    await page.evaluate(() =>
      (document.querySelector('[data-testid="lifecycle-toggle-disabled"]') as HTMLElement).click()
    )
    expect(await settled()).toEqual({ resizing: false, userSelect: '', cursor: '' })
    await page.mouse.up()
    await expect(page.getByTestId('lifecycle-change-end-count')).toHaveText('0')
    await expect(page.getByTestId('lifecycle-value-display')).toHaveText('Layout: 50% / 50%')
    await page.evaluate(() =>
      (document.querySelector('[data-testid="lifecycle-toggle-disabled"]') as HTMLElement).click()
    )

    // Removing the handle mid-drag is a structural error (FEATURES #9):
    // the boundary reports the diagnostic, the session still cleans up once
    // with no end, and restoring the handle recovers the group.
    const b = await handleCenter(page, 'lifecycle-handle-0')
    await page.mouse.move(b.x, b.y)
    await page.mouse.down()
    await page.mouse.move(b.x + 20, b.y, { steps: 2 })
    await page.evaluate(() =>
      (document.querySelector('[data-testid="lifecycle-toggle-handle"]') as HTMLElement).click()
    )
    await expect(page.getByTestId('lifecycle-structure-error')).toContainText(
      'need exactly 1 Handle, but 0 are mounted'
    )
    // The boundary unmounted the crashed tree, so the root (and its
    // data-resizing) is gone; the document lock is what must be clean.
    expect(await settled()).toEqual({ resizing: undefined, userSelect: '', cursor: '' })
    await page.mouse.up()
    await expect(page.getByTestId('lifecycle-change-end-count')).toHaveText('0')
    await page.evaluate(() =>
      (document.querySelector('[data-testid="lifecycle-toggle-handle"]') as HTMLElement).click()
    )
    await expect(page.getByTestId('lifecycle-handle-0')).toBeVisible()
    const recovered = await handleCenter(page, 'lifecycle-handle-0')
    await page.mouse.move(recovered.x, recovered.y)
    await page.mouse.down()
    await page.mouse.move(recovered.x + 40, recovered.y, { steps: 4 })
    await page.mouse.up()
    await expect(page.getByTestId('lifecycle-change-end-count')).toHaveText('1')

    // Unmounting the root releases the document lock without crashing.
    const c = await handleCenter(page, 'lifecycle-handle-0')
    await page.mouse.move(c.x, c.y)
    await page.mouse.down()
    await page.mouse.move(c.x + 20, c.y, { steps: 2 })
    await page.evaluate(() =>
      (document.querySelector('[data-testid="lifecycle-toggle-mounted"]') as HTMLElement).click()
    )
    await expect(page.getByTestId('lifecycle-unmounted')).toBeVisible()
    const afterUnmount = await page.evaluate(() => ({
      userSelect: (document.body.style.getPropertyValue('user-select') || document.body.style.getPropertyValue('-webkit-user-select')),
      cursor: document.body.style.cursor,
    }))
    expect(afterUnmount).toEqual({ userSelect: '', cursor: '' })
    await page.mouse.up()
    await page.evaluate(() =>
      (document.querySelector('[data-testid="lifecycle-toggle-mounted"]') as HTMLElement).click()
    )
    // Still 1 from the recovery drag: the unmounted gesture added no end.
    await expect(page.getByTestId('lifecycle-change-end-count')).toHaveText('1')
  })
})
