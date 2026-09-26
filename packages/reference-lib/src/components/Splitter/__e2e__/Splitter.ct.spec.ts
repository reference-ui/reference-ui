import type { Page } from '@playwright/test'
import { test, expect, snap } from '../../../../playwright/ct'

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
  test('SP-DOM-01: Renders splitter panels and handle and responds to keyboard resize', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Basic')
    const handle = page.getByTestId('splitter-handle-0')
    const display = page.getByTestId('splitter-value-display')

    await expect(handle).toBeVisible()
    await expect(handle).toHaveAttribute('role', 'separator')
    await expect(handle).toHaveAttribute('aria-valuenow', '40')
    await expect(display).toHaveText('Layout: 40% / 60%')

    await page.waitForTimeout(300)
    await snap(page, 'resting')

    // Hover handle
    await handle.hover()
    await page.waitForTimeout(200)
    await snap(page, 'handle-hover')

    // Keyboard ArrowRight increases left panel by 1% -> 41% / 59%
    await handle.focus()
    await page.waitForTimeout(200)
    await snap(page, 'handle-focus')

    await page.keyboard.press('ArrowRight')
    await expect(handle).toHaveAttribute('aria-valuenow', '41')
    await expect(display).toHaveText('Layout: 41% / 59%')

    await page.waitForTimeout(200)
    await snap(page, 'resized-41')

    // Keyboard Shift+ArrowRight increases by 10% -> 51% / 49%
    await page.keyboard.press('Shift+ArrowRight')
    await expect(handle).toHaveAttribute('aria-valuenow', '51')
    await expect(display).toHaveText('Layout: 51% / 49%')

    await page.waitForTimeout(200)
    await snap(page, 'resized-51')
  })

  test('SP-DOM-03: Handles expose honest constrained ARIA values', async ({ mount, page }) => {
    await mount('components/Splitter/Splitter/Basic')
    const handle = page.getByTestId('splitter-handle-0')

    // Default floor: panels clamp to [5, 95], and the separator says so.
    await expect(handle).toHaveAttribute('aria-valuemin', '5')
    await expect(handle).toHaveAttribute('aria-valuemax', '95')
    await expect(handle).toHaveAttribute('aria-valuenow', '40')
  })

  test('SP-DOM-03: Unconstrained panels clamp to the 5% default floor (FEATURES #10)', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Basic')
    const handle = page.getByTestId('splitter-handle-0')
    const display = page.getByTestId('splitter-value-display')

    // Decided: KEEP 5% — an unconstrained Panel shrinks to the floor, never
    // to nothing, on both bounds.
    await handle.focus()
    await page.keyboard.press('Home')
    await expect(display).toHaveText('Layout: 5% / 95%')
    await expect(handle).toHaveAttribute('aria-valuenow', '5')

    await page.keyboard.press('End')
    await expect(display).toHaveText('Layout: 95% / 5%')
    await expect(handle).toHaveAttribute('aria-valuenow', '95')
  })

  test('SP-KEY-04: Home and End move to feasible min/max bounds', async ({ mount, page }) => {
    await mount('components/Splitter/Splitter/Constrained')
    const handle = page.getByTestId('constrained-handle-0')
    const display = page.getByTestId('constrained-value-display')

    // Author constraints surface as the separator's feasible range.
    await expect(handle).toHaveAttribute('aria-valuemin', '20')
    await expect(handle).toHaveAttribute('aria-valuemax', '60')

    await handle.focus()
    await page.keyboard.press('Home')
    await expect(display).toHaveText('Layout: 20% / 80%')
    await expect(handle).toHaveAttribute('aria-valuenow', '20')

    await page.keyboard.press('End')
    await expect(display).toHaveText('Layout: 60% / 40%')
    await expect(handle).toHaveAttribute('aria-valuenow', '60')

    // At the bound, further motion is an exact no-op: no onChange.
    const changeCount = page.getByTestId('change-count')
    const before = await changeCount.innerText()
    await page.keyboard.press('End')
    await expect(display).toHaveText('Layout: 60% / 40%')
    await expect(changeCount).toHaveText(before)
  })

  test('SP-CTRL-06: Cross-axis keys fire no onChange', async ({ mount, page }) => {
    await mount('components/Splitter/Splitter/Constrained')
    const handle = page.getByTestId('constrained-handle-0')
    const changeCount = page.getByTestId('change-count')
    const display = page.getByTestId('constrained-value-display')

    await expect(changeCount).toHaveText('0')
    await handle.focus()
    await page.keyboard.press('ArrowUp')
    await page.keyboard.press('ArrowDown')
    await expect(changeCount).toHaveText('0')
    await expect(display).toHaveText('Layout: 40% / 60%')
  })

  test('SP-END-01: Drag calls onChangeEnd exactly once', async ({ mount, page }) => {
    await mount('components/Splitter/Splitter/Constrained')
    const handle = page.getByTestId('constrained-handle-0')
    const box = await handle.boundingBox()
    expect(box).not.toBeNull()

    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.mouse.down()
    await page.mouse.move(box!.x + box!.width / 2 + 40, box!.y + box!.height / 2, { steps: 4 })
    await page.mouse.up()

    await expect(page.getByTestId('change-end-count')).toHaveText('1')
    await expect(handle).toHaveAttribute('aria-valuenow', '50')

    // Releasing outside the handle still closes the session exactly once.
    const moved = await handleCenter(page, 'constrained-handle-0')
    await page.mouse.move(moved.x, moved.y)
    await page.mouse.down()
    await page.mouse.move(moved.x + 80, moved.y, { steps: 4 })
    await page.mouse.move(640, 690)
    await page.mouse.up()

    await expect(page.getByTestId('change-end-count')).toHaveText('2')
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 60% / 40%')

    // Compatibility mouse/click input after the gesture adds no duplicate end.
    const changes = await page.getByTestId('change-count').innerText()
    await handle.click()
    await expect(page.getByTestId('change-end-count')).toHaveText('2')
    await expect(page.getByTestId('change-count')).toHaveText(changes)
  })

  test('SP-END-03: Pointer press without movement fires no callbacks', async ({ mount, page }) => {
    await mount('components/Splitter/Splitter/Constrained')
    const handle = page.getByTestId('constrained-handle-0')
    const box = await handle.boundingBox()
    expect(box).not.toBeNull()

    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.mouse.down()
    await page.mouse.up()

    await expect(page.getByTestId('change-count')).toHaveText('0')
    await expect(page.getByTestId('change-end-count')).toHaveText('0')
  })

  test('SP-COLLAPSE-04: Keyboard resize past min snaps a collapsible panel to collapsed size', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/CollapsibleDemo')
    const handle = page.getByTestId('collapsible-handle-0')
    const display = page.getByTestId('collapsible-value-display')

    await handle.focus()
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('ArrowLeft')
    }
    await expect(display).toHaveText('Layout: 20% / 80%')

    // One more step past min collapses to the opted-in collapsed size.
    await page.keyboard.press('ArrowLeft')
    await expect(display).toHaveText('Layout: 5% / 95%')

    // And a step back out restores the minimum, not a fractional size.
    await page.keyboard.press('ArrowRight')
    await expect(display).toHaveText('Layout: 20% / 80%')
  })

  test('SP-DOM-02: Vertical orientation supports ArrowDown and ArrowUp resize', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Vertical')
    const handle = page.getByTestId('splitter-vertical-handle')

    await expect(handle).toBeVisible()
    await expect(handle).toHaveAttribute('role', 'separator')
    await expect(handle).toHaveAttribute('aria-valuenow', '50')

    await page.waitForTimeout(300)
    await snap(page, 'vertical-resting')

    await handle.focus()
    await page.keyboard.press('ArrowDown')
    await expect(handle).toHaveAttribute('aria-valuenow', '51')

    await page.waitForTimeout(200)
    await snap(page, 'vertical-resized-51')
  })
})

test.describe('Splitter PATCHES item 1: pointer-session robustness', () => {
  test('SP-DRAG-01: Primary pointerdown focuses, captures, and marks resizing before any move', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Constrained')
    const center = await handleCenter(page, 'constrained-handle-0')
    await recordNextPointerId(page, 'constrained-handle-0')

    await page.mouse.move(center.x, center.y)
    await page.mouse.down()
    // Read after the down round-trip (no moves issued): capture, focus, and
    // resizing hooks are all taken synchronously on pointerdown.
    const probe = await page.evaluate((pointerId: number) => {
      const el = document.querySelector('[data-testid="constrained-handle-0"]') as HTMLElement
      const root = document.querySelector(
        '[data-testid="test-splitter-constrained"]'
      ) as HTMLElement
      return {
        captured: el.hasPointerCapture(pointerId),
        focused: document.activeElement === el,
        rootResizing: root.hasAttribute('data-resizing'),
        handleResizing: el.hasAttribute('data-resizing'),
        panelsResizing: [...root.querySelectorAll('[data-reference-splitter-panel]')].every((p) =>
          p.hasAttribute('data-resizing')
        ),
      }
    }, await lastPointerId(page))
    expect(probe.captured).toBe(true)
    expect(probe.focused).toBe(true)
    expect(probe.rootResizing).toBe(true)
    expect(probe.handleResizing).toBe(true)
    expect(probe.panelsResizing).toBe(true)
    // No movement yet, so no callbacks have fired.
    await expect(page.getByTestId('change-count')).toHaveText('0')
    await expect(page.getByTestId('change-end-count')).toHaveText('0')

    await page.mouse.up()
    await expect(page.getByTestId('change-end-count')).toHaveText('0')
  })

  test('SP-DRAG-04: Captured drag continues beyond the handle, group, and edges', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Constrained')
    const center = await handleCenter(page, 'constrained-handle-0')

    await page.mouse.move(center.x, center.y)
    await page.mouse.down()
    // Far beyond the left group edge: clamps at the panel minimum.
    await page.mouse.move(2, center.y, { steps: 4 })
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 20% / 80%')
    // Across the body to beyond the right edge: clamps at the maximum.
    await page.mouse.move(1270, center.y, { steps: 8 })
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 60% / 40%')
    await page.mouse.up()

    // One session throughout: exactly one end for the whole gesture.
    await expect(page.getByTestId('change-end-count')).toHaveText('1')
  })

  test('SP-DRAG-05: Touch session isolates its pointer id (first slice)', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Constrained')
    const at = await handleCenter(page, 'constrained-handle-0')

    await dispatchPointer(
      page,
      'constrained-handle-0',
      'pointerdown',
      { pointerId: 7, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1, xy: at }
    )
    await expect(page.getByTestId('test-splitter-constrained')).toHaveAttribute('data-resizing', '')

    // A second contact must not own the group; its moves are ignored.
    await dispatchPointer(
      page,
      'constrained-handle-0',
      'pointerdown',
      { pointerId: 8, pointerType: 'touch', isPrimary: false, button: 0, buttons: 1, xy: at }
    )
    await dispatchPointer(
      page,
      'constrained-handle-0',
      'pointermove',
      { pointerId: 8, pointerType: 'touch', isPrimary: false, buttons: 1, xy: { x: at.x + 200, y: at.y } },
      'window'
    )
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 40% / 60%')

    await dispatchPointer(
      page,
      'constrained-handle-0',
      'pointermove',
      { pointerId: 7, pointerType: 'touch', isPrimary: true, buttons: 1, xy: { x: at.x + 40, y: at.y } },
      'window'
    )
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 50% / 50%')

    await dispatchPointer(
      page,
      'constrained-handle-0',
      'pointerup',
      { pointerId: 7, pointerType: 'touch', isPrimary: true, buttons: 0, xy: { x: at.x + 40, y: at.y } },
      'window'
    )
    await expect(page.getByTestId('change-end-count')).toHaveText('1')
  })

  test('SP-DRAG-06: Only primary button-0 input starts a session', async ({ mount, page }) => {
    await mount('components/Splitter/Splitter/Constrained')
    const center = await handleCenter(page, 'constrained-handle-0')

    // A primary pen drags exactly like a mouse.
    const pen = await handleCenter(page, 'constrained-handle-0')
    await dispatchPointer(
      page,
      'constrained-handle-0',
      'pointerdown',
      { pointerId: 7, pointerType: 'pen', isPrimary: true, button: 0, buttons: 1, xy: pen }
    )
    await dispatchPointer(
      page,
      'constrained-handle-0',
      'pointermove',
      { pointerId: 7, pointerType: 'pen', isPrimary: true, buttons: 1, xy: { x: pen.x + 40, y: pen.y } },
      'window'
    )
    await dispatchPointer(
      page,
      'constrained-handle-0',
      'pointerup',
      { pointerId: 7, pointerType: 'pen', isPrimary: true, buttons: 0, xy: { x: pen.x + 40, y: pen.y } },
      'window'
    )
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 50% / 50%')
    await expect(page.getByTestId('change-end-count')).toHaveText('1')

    // Mouse button 2 starts no state, capture, or callbacks.
    await page.mouse.move(center.x, center.y)
    await page.mouse.down({ button: 'right' })
    await page.waitForTimeout(100)
    await expect(page.getByTestId('test-splitter-constrained')).not.toHaveAttribute(
      'data-resizing',
      ''
    )
    await expect(page.getByTestId('change-count')).toHaveText('1')
    await expect(page.getByTestId('change-end-count')).toHaveText('1')
    await page.mouse.up({ button: 'right' })

    // A non-primary pointer and an auxiliary pen button are ignored.
    const silent = await page.evaluate(() => {
      const handle = document.querySelector('[data-testid="constrained-handle-0"]') as HTMLElement
      const root = document.querySelector(
        '[data-testid="test-splitter-constrained"]'
      ) as HTMLElement
      const rect = handle.getBoundingClientRect()
      const at = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }
      handle.dispatchEvent(
        new PointerEvent('pointerdown', {
          pointerId: 8,
          pointerType: 'touch',
          isPrimary: false,
          button: 0,
          buttons: 1,
          ...at,
          bubbles: true,
          cancelable: true,
        })
      )
      const afterNonPrimary = root.hasAttribute('data-resizing')
      handle.dispatchEvent(
        new PointerEvent('pointerdown', {
          pointerId: 9,
          pointerType: 'pen',
          isPrimary: true,
          button: 2,
          buttons: 2,
          ...at,
          bubbles: true,
          cancelable: true,
        })
      )
      return { afterNonPrimary, afterAux: root.hasAttribute('data-resizing') }
    })
    expect(silent.afterNonPrimary).toBe(false)
    expect(silent.afterAux).toBe(false)
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 50% / 50%')
    await expect(page.getByTestId('change-count')).toHaveText('1')
    await expect(page.getByTestId('change-end-count')).toHaveText('1')
  })

  test('SP-DRAG-07: Active drag locks selection and shows the resize cursor', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Constrained')
    const center = await handleCenter(page, 'constrained-handle-0')

    await page.mouse.move(center.x, center.y)
    await page.mouse.down()
    const during = await page.evaluate(() => ({
      userSelect: document.body.style.userSelect,
      cursor: document.body.style.cursor,
    }))
    expect(during.userSelect).toBe('none')
    expect(during.cursor).toBe('col-resize')

    // Drag across the selectable panel text.
    await page.mouse.move(center.x + 120, center.y + 40, { steps: 6 })
    await page.mouse.up()

    const after = await page.evaluate(() => ({
      userSelect: document.body.style.userSelect,
      cursor: document.body.style.cursor,
      selection: window.getSelection()?.toString() ?? '',
    }))
    expect(after.userSelect).toBe('')
    expect(after.cursor).toBe('')
    expect(after.selection).toBe('')
  })

  test('SP-DRAG-08: Release outside the handle cleans up once and keeps focus', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Constrained')
    const center = await handleCenter(page, 'constrained-handle-0')

    await page.mouse.move(center.x, center.y)
    await page.mouse.down()
    await page.mouse.move(center.x + 40, center.y, { steps: 4 })
    await page.mouse.move(640, 690)
    await page.mouse.up()

    await expect(page.getByTestId('change-end-count')).toHaveText('1')
    await expect(page.getByTestId('test-splitter-constrained')).not.toHaveAttribute(
      'data-resizing',
      ''
    )
    await expect(page.getByTestId('constrained-handle-0')).not.toHaveAttribute('data-resizing', '')
    await expect(page.getByTestId('constrained-panel-0')).not.toHaveAttribute('data-resizing', '')
    await expect(page.getByTestId('constrained-panel-1')).not.toHaveAttribute('data-resizing', '')
    const styles = await page.evaluate(() => ({
      userSelect: document.body.style.userSelect,
      cursor: document.body.style.cursor,
    }))
    expect(styles.userSelect).toBe('')
    expect(styles.cursor).toBe('')
    const focused = await page.evaluate(
      () =>
        document.activeElement?.getAttribute('data-testid') === 'constrained-handle-0'
    )
    expect(focused).toBe(true)

    // The owner was released: a fresh drag opens a fresh session.
    const next = await handleCenter(page, 'constrained-handle-0')
    await page.mouse.move(next.x, next.y)
    await page.mouse.down()
    await page.mouse.move(next.x - 40, next.y, { steps: 4 })
    await page.mouse.up()
    await expect(page.getByTestId('change-end-count')).toHaveText('2')
  })

  test('SP-DRAG-09: Cancel paths abort the drag with one cleanup and no end', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Constrained')

    const settled = () =>
      page.evaluate(() => ({
        resizing: document
          .querySelector('[data-testid="test-splitter-constrained"]')
          ?.hasAttribute('data-resizing'),
        userSelect: document.body.style.userSelect,
        cursor: document.body.style.cursor,
      }))

    // (i) pointercancel after a changed request.
    await recordNextPointerId(page, 'constrained-handle-0')
    const a = await handleCenter(page, 'constrained-handle-0')
    await page.mouse.move(a.x, a.y)
    await page.mouse.down()
    await page.mouse.move(a.x + 40, a.y, { steps: 4 })
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 50% / 50%')
    await dispatchPointer(
      page,
      'constrained-handle-0',
      'pointercancel',
      { pointerId: await lastPointerId(page), buttons: 1 },
      'window'
    )
    expect(await settled()).toEqual({ resizing: false, userSelect: '', cursor: '' })
    await page.mouse.up()
    await expect(page.getByTestId('change-end-count')).toHaveText('0')
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 50% / 50%')

    // (ii) Lost capture aborts the same way. The browser dispatches
    // lostpointercapture asynchronously, so wait for the hook to clear.
    await recordNextPointerId(page, 'constrained-handle-0')
    const b = await handleCenter(page, 'constrained-handle-0')
    await page.mouse.move(b.x, b.y)
    await page.mouse.down()
    await page.mouse.move(b.x + 20, b.y, { steps: 2 })
    await page.evaluate(async () => {
      const el = document.querySelector('[data-testid="constrained-handle-0"]') as HTMLElement
      el.releasePointerCapture((window as unknown as { __spId: number }).__spId)
    })
    await expect(page.getByTestId('test-splitter-constrained')).not.toHaveAttribute(
      'data-resizing',
      ''
    )
    expect(await settled()).toEqual({ resizing: false, userSelect: '', cursor: '' })
    await page.mouse.up()
    await expect(page.getByTestId('change-end-count')).toHaveText('0')

    // (iii) A move with no buttons means the release was missed: abort.
    await recordNextPointerId(page, 'constrained-handle-0')
    const c = await handleCenter(page, 'constrained-handle-0')
    await page.mouse.move(c.x, c.y)
    await page.mouse.down()
    await dispatchPointer(
      page,
      'constrained-handle-0',
      'pointermove',
      { pointerId: await lastPointerId(page), buttons: 0, dx: 60 },
      'window'
    )
    expect(await settled()).toEqual({ resizing: false, userSelect: '', cursor: '' })
    await page.mouse.up()
    await expect(page.getByTestId('change-end-count')).toHaveText('0')

    // (iv) Window blur aborts the session.
    const d = await handleCenter(page, 'constrained-handle-0')
    await page.mouse.move(d.x, d.y)
    await page.mouse.down()
    await page.mouse.move(d.x + 20, d.y, { steps: 2 })
    await page.evaluate(() => window.dispatchEvent(new Event('blur')))
    expect(await settled()).toEqual({ resizing: false, userSelect: '', cursor: '' })
    await page.mouse.up()
    await expect(page.getByTestId('change-end-count')).toHaveText('0')
  })

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
        userSelect: document.body.style.userSelect,
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

    // Removing the handle mid-drag cancels too.
    const b = await handleCenter(page, 'lifecycle-handle-0')
    await page.mouse.move(b.x, b.y)
    await page.mouse.down()
    await page.mouse.move(b.x + 20, b.y, { steps: 2 })
    await page.evaluate(() =>
      (document.querySelector('[data-testid="lifecycle-toggle-handle"]') as HTMLElement).click()
    )
    expect(await settled()).toEqual({ resizing: false, userSelect: '', cursor: '' })
    await page.mouse.up()
    await expect(page.getByTestId('lifecycle-change-end-count')).toHaveText('0')
    await page.evaluate(() =>
      (document.querySelector('[data-testid="lifecycle-toggle-handle"]') as HTMLElement).click()
    )

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
      userSelect: document.body.style.userSelect,
      cursor: document.body.style.cursor,
    }))
    expect(afterUnmount).toEqual({ userSelect: '', cursor: '' })
    await page.mouse.up()
    await page.evaluate(() =>
      (document.querySelector('[data-testid="lifecycle-toggle-mounted"]') as HTMLElement).click()
    )
    await expect(page.getByTestId('lifecycle-change-end-count')).toHaveText('0')
  })

  test('SP-DRAG-10: Only the first pointer owns the group', async ({ mount, page }) => {
    await mount('components/Splitter/Splitter/ThreePanel')
    const first = await handleCenter(page, 'threepanel-handle-0')

    await page.mouse.move(first.x, first.y)
    await page.mouse.down()

    // A second primary pointer on either handle cannot start or steer.
    await dispatchPointer(
      page,
      'threepanel-handle-0',
      'pointerdown',
      { pointerId: 99, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1 }
    )
    await dispatchPointer(
      page,
      'threepanel-handle-0',
      'pointermove',
      { pointerId: 99, buttons: 1, dx: 200 },
      'window'
    )
    await dispatchPointer(
      page,
      'threepanel-handle-1',
      'pointerdown',
      { pointerId: 99, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1 }
    )
    await dispatchPointer(
      page,
      'threepanel-handle-1',
      'pointermove',
      { pointerId: 99, buttons: 1, dx: -200 },
      'window'
    )
    await expect(page.getByTestId('threepanel-value-display')).toHaveText(
      'Layout: 20% / 30% / 50%'
    )

    // Only pointer 1 moves values, on its own boundary.
    await page.mouse.move(first.x + 40, first.y, { steps: 4 })
    await expect(page.getByTestId('threepanel-value-display')).toHaveText(
      'Layout: 30% / 20% / 50%'
    )

    // Releasing pointer 2 cannot end the session.
    await dispatchPointer(page, 'threepanel-handle-0', 'pointerup', { pointerId: 99 }, 'window')
    await page.mouse.move(first.x + 80, first.y, { steps: 4 })
    await expect(page.getByTestId('threepanel-value-display')).toHaveText(
      'Layout: 40% / 10% / 50%'
    )
    await page.mouse.up()
    await expect(page.getByTestId('threepanel-change-end-count')).toHaveText('1')
  })

  test('SP-DRAG-11: Nested groups resize only the owning group', async ({ mount, page }) => {
    await mount('components/Splitter/Splitter/Nested')

    // Inner vertical drag: only the inner group responds.
    const inner = await handleCenter(page, 'nested-inner-handle-0')
    await page.mouse.move(inner.x, inner.y)
    await page.mouse.down()
    await page.mouse.move(inner.x, inner.y + 48, { steps: 4 })
    const during = await page.evaluate(() => ({
      innerResizing: document
        .querySelector('[data-testid="nested-inner"]')
        ?.hasAttribute('data-resizing'),
      outerResizing: document
        .querySelector('[data-testid="nested-outer"]')
        ?.hasAttribute('data-resizing'),
      outerHandleResizing: document
        .querySelector('[data-testid="nested-outer-handle-0"]')
        ?.hasAttribute('data-resizing'),
      outerPanelResizing: document
        .querySelector('[data-testid="nested-outer-panel-0"]')
        ?.hasAttribute('data-resizing'),
      innerPanelResizing: document
        .querySelector('[data-testid="nested-inner-panel-0"]')
        ?.hasAttribute('data-resizing'),
      cursor: document.body.style.cursor,
    }))
    expect(during).toEqual({
      innerResizing: true,
      outerResizing: false,
      outerHandleResizing: false,
      outerPanelResizing: false,
      innerPanelResizing: true,
      cursor: 'row-resize',
    })
    await page.mouse.up()
    await expect(page.getByTestId('nested-inner-display')).toHaveText('Inner: 70% / 30%')
    await expect(page.getByTestId('nested-outer-display')).toHaveText('Outer: 40% / 60%')
    await expect(page.getByTestId('nested-inner-ends')).toHaveText('1')
    await expect(page.getByTestId('nested-outer-ends')).toHaveText('0')

    // Outer horizontal drag: only the outer group responds.
    const outer = await handleCenter(page, 'nested-outer-handle-0')
    await page.mouse.move(outer.x, outer.y)
    await page.mouse.down()
    await page.mouse.move(outer.x + 40, outer.y, { steps: 4 })
    await page.mouse.up()
    await expect(page.getByTestId('nested-outer-display')).toHaveText('Outer: 50% / 50%')
    await expect(page.getByTestId('nested-inner-display')).toHaveText('Inner: 70% / 30%')
    await expect(page.getByTestId('nested-outer-ends')).toHaveText('1')
    await expect(page.getByTestId('nested-inner-ends')).toHaveText('1')
  })

  test('SP-DRAG-12: Secondary click terminates the drag; the held release is a no-op', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Constrained')
    const center = await handleCenter(page, 'constrained-handle-0')

    await page.mouse.move(center.x, center.y)
    await page.mouse.down()
    await page.mouse.move(center.x + 40, center.y, { steps: 4 })
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 50% / 50%')

    await page.mouse.down({ button: 'right' })
    await expect(page.getByTestId('change-end-count')).toHaveText('1')
    await expect(page.getByTestId('test-splitter-constrained')).not.toHaveAttribute(
      'data-resizing',
      ''
    )
    await page.mouse.up({ button: 'right' })

    // The still-held primary button is now inert.
    const changes = await page.getByTestId('change-count').innerText()
    await page.mouse.move(center.x + 120, center.y, { steps: 4 })
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 50% / 50%')
    await page.mouse.up()
    await expect(page.getByTestId('change-end-count')).toHaveText('1')
    await expect(page.getByTestId('change-count')).toHaveText(changes)
    const styles = await page.evaluate(() => ({
      userSelect: document.body.style.userSelect,
      cursor: document.body.style.cursor,
    }))
    expect(styles).toEqual({ userSelect: '', cursor: '' })
  })

  test('SP-END-03: Canceled keyboard sessions emit no end', async ({ mount, page }) => {
    await mount('components/Splitter/Splitter/Constrained')
    const handle = page.getByTestId('constrained-handle-0')

    // Blur before keyup cancels the changed session.
    await handle.focus()
    await page.keyboard.down('ArrowRight')
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 41% / 59%')
    await page.evaluate(() =>
      (document.querySelector('[data-testid="constrained-handle-0"]') as HTMLElement).blur()
    )
    await page.keyboard.up('ArrowRight')
    await expect(page.getByTestId('change-end-count')).toHaveText('0')

    // Disable before keyup cancels the same way.
    await mount('components/Splitter/Splitter/Lifecycle')
    const life = page.getByTestId('lifecycle-handle-0')
    await life.focus()
    await page.keyboard.down('ArrowRight')
    await expect(page.getByTestId('lifecycle-value-display')).toHaveText('Layout: 41% / 59%')
    await page.evaluate(() =>
      (document.querySelector('[data-testid="lifecycle-toggle-disabled"]') as HTMLElement).click()
    )
    await page.keyboard.up('ArrowRight')
    await expect(page.getByTestId('lifecycle-change-end-count')).toHaveText('0')
  })

  test('SP-END-04: Rejected requests report the last request to the latest handler', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Rejecting')

    // Hold a synthetic drag so the mouse stays free for mid-gesture swaps.
    await dispatchPointer(
      page,
      'rejecting-handle-0',
      'pointerdown',
      { pointerId: 7, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1 }
    )
    await page.getByTestId('rejecting-swap-constraints').click()
    await page.getByTestId('rejecting-swap-handler').click()
    await expect(page.getByTestId('rejecting-handler')).toHaveText('B')

    // Solved from the origin with the NEW maximum: 40 + 12.5 clamps to 50.
    await dispatchPointer(
      page,
      'rejecting-handle-0',
      'pointermove',
      { pointerId: 7, buttons: 1, dx: 50 },
      'window'
    )
    // Further motion past the bound is an exact no-op.
    await dispatchPointer(
      page,
      'rejecting-handle-0',
      'pointermove',
      { pointerId: 7, buttons: 1, dx: 100 },
      'window'
    )
    await dispatchPointer(
      page,
      'rejecting-handle-0',
      'pointermove',
      { pointerId: 7, buttons: 1, dx: 150 },
      'window'
    )
    await expect(page.getByTestId('rejecting-requests')).toHaveText('B:[50,50]')

    await dispatchPointer(
      page,
      'rejecting-handle-0',
      'pointerup',
      { pointerId: 7, buttons: 0, dx: 150 },
      'window'
    )
    // The end carries the last requested layout, not the controlled value.
    await expect(page.getByTestId('rejecting-ends')).toHaveText('B:[50,50]')
    await expect(page.getByTestId('rejecting-handle-0')).toHaveAttribute('aria-valuenow', '40')
  })
})

test.describe('Splitter PATCHES item 2: keyboard interaction sessions', () => {
  test('SP-END-02: Repeated keys form one interaction ending on keyup', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Constrained')
    await page.getByTestId('constrained-handle-0').focus()

    // One keydown plus three native repeats, then a single release.
    await dispatchKey(page, 'constrained-handle-0', 'keydown', {
      key: 'ArrowRight',
      repeat: false,
    })
    for (let i = 0; i < 3; i++) {
      await dispatchKey(page, 'constrained-handle-0', 'keydown', {
        key: 'ArrowRight',
        repeat: true,
      })
    }
    await expect(page.getByTestId('change-count')).toHaveText('4')
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 44% / 56%')
    await expect(page.getByTestId('change-end-count')).toHaveText('0')
    await dispatchKey(page, 'constrained-handle-0', 'keyup', { key: 'ArrowRight' })
    await expect(page.getByTestId('change-end-count')).toHaveText('1')

    // Shift+Arrow repeats join the same one-end contract; the trailing Shift
    // release is a duplicate keyup and stays silent.
    await dispatchKey(page, 'constrained-handle-0', 'keydown', {
      key: 'Shift',
      repeat: false,
    })
    await dispatchKey(page, 'constrained-handle-0', 'keydown', {
      key: 'ArrowRight',
      shiftKey: true,
    })
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 54% / 46%')
    await dispatchKey(page, 'constrained-handle-0', 'keyup', { key: 'ArrowRight', shiftKey: true })
    await expect(page.getByTestId('change-end-count')).toHaveText('2')
    await dispatchKey(page, 'constrained-handle-0', 'keyup', { key: 'Shift' })
    await expect(page.getByTestId('change-end-count')).toHaveText('2')

    // Home and End each end their own interaction once.
    await dispatchKey(page, 'constrained-handle-0', 'keydown', { key: 'End' })
    await dispatchKey(page, 'constrained-handle-0', 'keyup', { key: 'End' })
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 60% / 40%')
    await expect(page.getByTestId('change-end-count')).toHaveText('3')
    await dispatchKey(page, 'constrained-handle-0', 'keydown', { key: 'Home' })
    await dispatchKey(page, 'constrained-handle-0', 'keyup', { key: 'Home' })
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 20% / 80%')
    await expect(page.getByTestId('change-end-count')).toHaveText('4')

    // An unchanged bound key and a duplicate keyup emit no end.
    await dispatchKey(page, 'constrained-handle-0', 'keydown', { key: 'Home' })
    await dispatchKey(page, 'constrained-handle-0', 'keyup', { key: 'Home' })
    await dispatchKey(page, 'constrained-handle-0', 'keyup', { key: 'Home' })
    await expect(page.getByTestId('change-end-count')).toHaveText('4')
  })

  test('SP-END-02: Enter collapse and restore each end once on keyup', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/CollapsibleDemo')
    const handle = page.getByTestId('collapsible-handle-0')
    await handle.focus()

    await page.keyboard.press('Enter')
    await expect(page.getByTestId('collapsible-value-display')).toHaveText('Layout: 5% / 95%')
    await expect(page.getByTestId('collapsible-change-count')).toHaveText('1')
    await expect(page.getByTestId('collapsible-change-end-count')).toHaveText('1')

    await page.keyboard.press('Enter')
    await expect(page.getByTestId('collapsible-value-display')).toHaveText('Layout: 40% / 60%')
    await expect(page.getByTestId('collapsible-change-count')).toHaveText('2')
    await expect(page.getByTestId('collapsible-change-end-count')).toHaveText('2')
  })

  test('SP-KEY-02: Cross-axis Arrows pass through to the application', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/KeyPassthrough')
    const handle = page.getByTestId('passthrough-handle-0')
    await handle.focus()

    for (const key of ['ArrowUp', 'ArrowDown']) {
      const unprevented = await dispatchKey(page, 'passthrough-handle-0', 'keydown', { key })
      expect(unprevented).toBe(true)
    }
    await expect(page.getByTestId('passthrough-received')).toHaveText('ArrowUp| ArrowDown|')
    await expect(page.getByTestId('passthrough-change-count')).toHaveText('0')
    await expect(page.getByTestId('passthrough-value-display')).toHaveText('Layout: 40% / 60%')
    await expect(handle).toHaveAttribute('aria-valuenow', '40')
    const focused = await page.evaluate(
      () => document.activeElement?.getAttribute('data-testid') === 'passthrough-handle-0'
    )
    expect(focused).toBe(true)

    // Vertical groups likewise ignore Left/Right.
    await mount('components/Splitter/Splitter/Vertical')
    const vertical = page.getByTestId('splitter-vertical-handle')
    await vertical.focus()
    for (const key of ['ArrowLeft', 'ArrowRight']) {
      const unprevented = await dispatchKey(page, 'splitter-vertical-handle', 'keydown', { key })
      expect(unprevented).toBe(true)
    }
    await expect(vertical).toHaveAttribute('aria-valuenow', '50')
  })

  test('SP-KEY-07: Modified, special, and printable keys pass through', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/KeyPassthrough')
    await page.getByTestId('passthrough-handle-0').focus()

    const cases: Array<{ key: string; init: KeyboardEventInit; received: string }> = [
      { key: 'ArrowRight', init: { ctrlKey: true }, received: 'ArrowRight|c' },
      { key: 'ArrowRight', init: { metaKey: true }, received: 'ArrowRight|m' },
      { key: 'ArrowRight', init: { altKey: true }, received: 'ArrowRight|a' },
      { key: 'PageUp', init: {}, received: 'PageUp|' },
      { key: 'PageDown', init: {}, received: 'PageDown|' },
      { key: 'Escape', init: {}, received: 'Escape|' },
      { key: 'F6', init: {}, received: 'F6|' },
      { key: 'a', init: {}, received: 'a|' },
    ]
    for (const { key, init } of cases) {
      const unprevented = await dispatchKey(page, 'passthrough-handle-0', 'keydown', {
        key,
        ...init,
      })
      expect(unprevented).toBe(true)
    }
    await expect(page.getByTestId('passthrough-received')).toHaveText(
      cases.map((c) => c.received).join(' ')
    )
    await expect(page.getByTestId('passthrough-change-count')).toHaveText('0')
    await expect(page.getByTestId('passthrough-value-display')).toHaveText('Layout: 40% / 60%')
    await expect(page.getByTestId('passthrough-handle-0')).toHaveAttribute('aria-valuenow', '40')
  })
})

test.describe('Splitter PATCHES item 3: Enter collapse and restore', () => {
  test('SP-COLLAPSE-01: Enter on an expanded collapsible panel requests collapsed size', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Sidebar')
    await page.getByTestId('sidebar-handle-0').focus()

    const unprevented = await dispatchKey(page, 'sidebar-handle-0', 'keydown', { key: 'Enter' })
    expect(unprevented).toBe(false)
    await expect(page.getByTestId('sidebar-last-request')).toHaveText('5,95')
    await expect(page.getByTestId('sidebar-change-count')).toHaveText('1')
    await expect(page.getByTestId('sidebar-value-display')).toHaveText('Layout: 5% / 95%')
    await expect(page.getByTestId('sidebar-panel-0')).toHaveAttribute('data-collapsed', '')

    await dispatchKey(page, 'sidebar-handle-0', 'keyup', { key: 'Enter' })
    await expect(page.getByTestId('sidebar-change-end-count')).toHaveText('1')
  })

  test('SP-COLLAPSE-02: Enter restores the last feasible expanded size', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Sidebar')
    const handle = page.getByTestId('sidebar-handle-0')
    await handle.focus()

    await page.keyboard.press('Enter')
    await expect(page.getByTestId('sidebar-value-display')).toHaveText('Layout: 5% / 95%')

    // Tightened constraints clamp the restore below the remembered size.
    await page.getByTestId('sidebar-tighten').click()
    await handle.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('sidebar-last-request')).toHaveText('25,75')
    await expect(page.getByTestId('sidebar-value-display')).toHaveText('Layout: 25% / 75%')
    await expect(page.getByTestId('sidebar-panel-0')).not.toHaveAttribute('data-collapsed', '')

    // Once constraints allow it, the newest expanded size is remembered.
    await page.getByTestId('sidebar-loosen').click()
    await handle.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('sidebar-value-display')).toHaveText('Layout: 5% / 95%')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('sidebar-last-request')).toHaveText('25,75')
    await expect(page.getByTestId('sidebar-value-display')).toHaveText('Layout: 25% / 75%')
  })

  test('SP-COLLAPSE-03: Enter beside a non-collapsible panel stays unprevented', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/KeyPassthrough')
    const handle = page.getByTestId('passthrough-handle-0')
    await handle.focus()

    const unprevented = await dispatchKey(page, 'passthrough-handle-0', 'keydown', { key: 'Enter' })
    expect(unprevented).toBe(true)
    await expect(page.getByTestId('passthrough-received')).toHaveText('Enter|')
    await expect(page.getByTestId('passthrough-change-count')).toHaveText('0')
    await expect(page.getByTestId('passthrough-value-display')).toHaveText('Layout: 40% / 60%')
    await expect(handle).toHaveAttribute('aria-valuenow', '40')
    await expect(handle).toHaveAttribute('aria-valuemin', '5')
    await expect(handle).toHaveAttribute('aria-valuemax', '95')
  })

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

test.describe('Splitter PATCHES item 4: RTL direction wiring', () => {
  test('SP-MATH-09: RTL reverses primary interpretation without touching values', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/DirToggle')
    const handle = page.getByTestId('dirtoggle-handle-0')

    await expect(handle).toHaveAttribute('aria-controls', 'dirtoggle-sidebar')
    await expect(handle).toHaveAttribute('aria-valuenow', '40')
    const panelBId = await page.getByTestId('dirtoggle-panel-b').getAttribute('id')
    expect(panelBId).toBeTruthy()

    await page.getByTestId('dirtoggle-toggle').click()
    await expect(page.getByTestId('dirtoggle-dir-display')).toHaveText('rtl')
    await expect(handle).toHaveAttribute('aria-controls', panelBId!)
    await expect(handle).toHaveAttribute('aria-valuenow', '60')
    // DOM-order pairing is untouched: A still sizes from entries[0].
    await expect(page.getByTestId('dirtoggle-value-display')).toHaveText('Layout: 40% / 60%')
    await expect(page.getByTestId('dirtoggle-panel-a')).toContainText('A (40%)')
    await expect(page.getByTestId('dirtoggle-panel-b')).toContainText('B (60%)')
    await expect(page.getByTestId('dirtoggle-change-count')).toHaveText('0')

    // Switching back restores the LTR primary with the same stable id.
    await page.getByTestId('dirtoggle-toggle').click()
    await expect(handle).toHaveAttribute('aria-controls', 'dirtoggle-sidebar')
    await expect(page.getByTestId('dirtoggle-panel-b')).toHaveAttribute('id', panelBId!)
  })

  test('SP-KEY-05: RTL reverses horizontal Arrows onto the logical primary', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/RtlSidebar')
    const handle = page.getByTestId('rtl-sidebar-handle-0')
    await handle.focus()

    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('rtl-sidebar-value-display')).toHaveText('Layout: 29% / 71%')
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('rtl-sidebar-value-display')).toHaveText('Layout: 30% / 70%')

    // Vertical Arrows are identical in LTR and RTL.
    await mount('components/Splitter/Splitter/DirToggleVertical')
    const vertical = page.getByTestId('dirtoggle-handle-0')
    await vertical.focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('dirtoggle-value-display')).toHaveText('Layout: 41% / 59%')
    await page.getByTestId('dirtoggle-toggle').click()
    await vertical.focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByTestId('dirtoggle-value-display')).toHaveText('Layout: 42% / 58%')
    await expect(vertical).toHaveAttribute('aria-controls', 'dirtoggle-sidebar')
  })

  test('SP-KEY-08: Mid-focus direction switches apply immediately', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/DirToggle')
    const handle = page.getByTestId('dirtoggle-handle-0')
    await handle.focus()

    // Toggle without moving focus: the parts never remount.
    await page.evaluate(() =>
      (document.querySelector('[data-testid="dirtoggle-toggle"]') as HTMLElement).click()
    )
    const stillFocused = await page.evaluate(
      () => document.activeElement?.getAttribute('data-testid') === 'dirtoggle-handle-0'
    )
    expect(stillFocused).toBe(true)
    const panelBId = await page.getByTestId('dirtoggle-panel-b').getAttribute('id')
    await expect(handle).toHaveAttribute('aria-controls', panelBId!)

    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('dirtoggle-value-display')).toHaveText('Layout: 39% / 61%')
  })

  test('SP-DRAG-02: Horizontal drag reverses under RTL', async ({ mount, page }) => {
    await mount('components/Splitter/Splitter/DirToggle')

    const ltr = await handleCenter(page, 'dirtoggle-handle-0')
    await page.mouse.move(ltr.x, ltr.y)
    await page.mouse.down()
    await page.mouse.move(ltr.x + 40, ltr.y, { steps: 4 })
    await page.mouse.up()
    await expect(page.getByTestId('dirtoggle-value-display')).toHaveText('Layout: 50% / 50%')

    await page.getByTestId('dirtoggle-toggle').click()
    const rtl = await handleCenter(page, 'dirtoggle-handle-0')
    await page.mouse.move(rtl.x, rtl.y)
    await page.mouse.down()
    await page.mouse.move(rtl.x + 40, rtl.y, { steps: 4 })
    await page.mouse.up()
    await expect(page.getByTestId('dirtoggle-value-display')).toHaveText('Layout: 40% / 60%')
    await expect(page.getByTestId('dirtoggle-panel-a')).toContainText('A (40%)')
    await expect(page.getByTestId('dirtoggle-panel-b')).toContainText('B (60%)')
  })

  test('SP-DOM-05: Handles link the logical primary in LTR and RTL', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/DirToggle')
    const handle = page.getByTestId('dirtoggle-handle-0')

    // Explicit ids win; the other panel carries a stable generated id.
    await expect(handle).toHaveAttribute('aria-controls', 'dirtoggle-sidebar')
    const panelBId = await page.getByTestId('dirtoggle-panel-b').getAttribute('id')
    expect(panelBId).toMatch(/^splitter-panel-/)
    const ltrTarget = await page.evaluate(
      (id) => document.getElementById(id)?.getAttribute('data-testid'),
      'dirtoggle-sidebar'
    )
    expect(ltrTarget).toBe('dirtoggle-panel-a')

    await page.getByTestId('dirtoggle-toggle').click()
    await expect(handle).toHaveAttribute('aria-controls', panelBId!)
    const rtlTarget = await page.evaluate(
      (id) => document.getElementById(id!)?.getAttribute('data-testid'),
      panelBId
    )
    expect(rtlTarget).toBe('dirtoggle-panel-b')
  })
})

test.describe('Splitter PATCHES item 6: reduced motion', () => {
  test('Handle transitions suppress under prefers-reduced-motion only', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Basic')
    const line = page.locator('[data-reference-splitter-handle-line]')
    const thumb = page.locator('[data-reference-splitter-thumb]')
    const dot = page.locator('[data-reference-splitter-thumb-dot]').first()

    const durations = () =>
      page.evaluate(() => {
        const pick = (sel: string) =>
          getComputedStyle(document.querySelector(sel) as HTMLElement).transitionDuration
        return {
          line: pick('[data-reference-splitter-handle-line]'),
          thumb: pick('[data-reference-splitter-thumb]'),
          dot: pick('[data-reference-splitter-thumb-dot]'),
        }
      })
    const properties = () =>
      page.evaluate(() => {
        const pick = (sel: string) =>
          getComputedStyle(document.querySelector(sel) as HTMLElement).transitionProperty
        return {
          line: pick('[data-reference-splitter-handle-line]'),
          thumb: pick('[data-reference-splitter-thumb]'),
          dot: pick('[data-reference-splitter-thumb-dot]'),
        }
      })

    await expect(line).toBeAttached()
    expect(await durations()).toEqual({ line: '0.15s', thumb: '0.15s, 0.15s', dot: '0.15s' })

    await page.emulateMedia({ reducedMotion: 'reduce' })
    expect(await properties()).toEqual({ line: 'none', thumb: 'none', dot: 'none' })

    await page.emulateMedia({ reducedMotion: 'no-preference' })
    expect(await durations()).toEqual({ line: '0.15s', thumb: '0.15s, 0.15s', dot: '0.15s' })
    await expect(thumb).toBeAttached()
    await expect(dot).toBeAttached()
  })
})

test.describe('Splitter PATCHES item 7: accessibility sweep', () => {
  test('SP-A11Y-01: Frozen layout variants expose honest separator semantics', async ({
    mount,
    page,
  }) => {
    // No axe-style checker is configured in this repo; the sweep asserts the
    // named SP-A11Y-01 properties directly. Full green additionally awaits the
    // FEATURES per-Handle disable semantics (aria-disabled call is open).
    await mount('components/Splitter/Splitter/A11ySweep')

    const sweep = await page.evaluate(() => {
      const groups: Record<string, { orientation: string; handles: string[] }> = {
        horizontal: { orientation: 'vertical', handles: ['a11y-horizontal-handle-0'] },
        vertical: { orientation: 'horizontal', handles: ['a11y-vertical-handle-0'] },
        three: {
          orientation: 'vertical',
          handles: ['a11y-three-handle-0', 'a11y-three-handle-1'],
        },
        mixed: { orientation: 'vertical', handles: ['a11y-mixed-handle-0', 'a11y-mixed-handle-1'] },
        collapsed: { orientation: 'vertical', handles: ['a11y-collapsed-handle-0'] },
      }
      const rows: Array<Record<string, string | number | boolean | null>> = []
      for (const [group, spec] of Object.entries(groups)) {
        const root = document.querySelector(`[data-testid="a11y-group-${group}"]`) as HTMLElement
        for (const testId of spec.handles) {
          const el = document.querySelector(`[data-testid="${testId}"]`) as HTMLElement
          const controls = el.getAttribute('aria-controls')
          const target = controls ? document.getElementById(controls) : null
          rows.push({
            testId,
            group,
            name: el.getAttribute('aria-label') ?? '',
            orientation: el.getAttribute('aria-orientation') ?? '',
            expectedOrientation: spec.orientation,
            min: Number(el.getAttribute('aria-valuemin')),
            now: Number(el.getAttribute('aria-valuenow')),
            max: Number(el.getAttribute('aria-valuemax')),
            controlsInGroup: !!target && root.contains(target),
            disabled: el.getAttribute('data-disabled'),
            tabIndex: el.tabIndex,
          })
        }
      }
      const collapsedPanel = document.querySelector(
        '[data-testid="a11y-group-collapsed"] [data-reference-splitter-panel]'
      ) as HTMLElement
      return { rows, collapsedHook: collapsedPanel.hasAttribute('data-collapsed') }
    })

    expect(sweep.rows).toHaveLength(7)
    for (const row of sweep.rows) {
      expect(row.name).toBeTruthy()
      expect(row.orientation).toBe(row.expectedOrientation)
      expect(row.min as number).toBeLessThanOrEqual(row.now as number)
      expect(row.now as number).toBeLessThanOrEqual(row.max as number)
      expect(row.controlsInGroup).toBe(true)
    }
    const mixedDisabled = sweep.rows.find((r) => r.testId === 'a11y-mixed-handle-1')!
    expect(mixedDisabled.disabled).toBe('')
    expect(mixedDisabled.tabIndex).toBe(-1)
    for (const row of sweep.rows) {
      if (row.testId === 'a11y-mixed-handle-1') continue
      expect(row.tabIndex).toBe(0)
      expect(row.disabled).toBeNull()
    }
    expect(sweep.collapsedHook).toBe(true)
  })
})
