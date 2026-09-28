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

  test('B-28: Panel constraint props never leak onto the DOM', async ({ mount, page }) => {
    // min/max/collapsible/collapsedSize are solver inputs, not DOM
    // attributes: no React unknown-prop errors, no css() miss-spam.
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', err => errors.push(String(err)))
    const leakedAttrs = () =>
      page.evaluate(() => {
        const names = ['min', 'max', 'minsize', 'maxsize', 'collapsible', 'collapsedsize']
        const hits: string[] = []
        for (const panel of document.querySelectorAll('[data-reference-splitter-panel]')) {
          for (const name of names) {
            if (panel.hasAttribute(name)) {
              hits.push(`${(panel as HTMLElement).dataset.testid ?? '?'}[${name}]`)
            }
          }
        }
        return hits
      })

    // CollapsibleDemo covers min + collapsible + collapsedSize.
    const demo = await mount('components/Splitter/Splitter/CollapsibleDemo')
    await expect(page.getByTestId('collapsible-panel-0')).toBeVisible()
    expect(await leakedAttrs()).toEqual([])
    await demo.unmount()

    // Constrained covers min + max.
    await mount('components/Splitter/Splitter/Constrained')
    await expect(page.getByTestId('constrained-panel-0')).toBeVisible()
    expect(await leakedAttrs()).toEqual([])

    expect(errors.filter(t => /collapsible|collapsedSize|minSize|maxSize/.test(t))).toEqual([])
  })

  test('B-28 REOPENED: legacy minSize/maxSize/index never leak to css() or the DOM', async ({
    mount,
    page,
  }) => {
    // Pre-rename call sites (minSize/maxSize/index, as in consumer code) must
    // not reach css() ("no compiled class for minSize: 10") or the DOM. The
    // aliases still drive the solver; index is stripped and ignored.
    const errors: string[] = []
    const warnings: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
      if (msg.type() === 'warning') warnings.push(msg.text())
    })
    page.on('pageerror', err => errors.push(String(err)))

    await mount('components/Splitter/Splitter/LegacyProps')
    await expect(page.getByTestId('legacy-panel-0')).toBeVisible()

    // Solver aliasing: minSize=10 / maxSize=90 bind the separator range.
    const handle = page.getByTestId('legacy-handle-0')
    await expect(handle).toHaveAttribute('aria-valuemin', '10')
    await expect(handle).toHaveAttribute('aria-valuemax', '90')

    // Zero DOM leak on Panels and the Handle.
    const leakedAttrs = await page.evaluate(() => {
      const names = ['minsize', 'maxsize', 'index', 'collapsible', 'collapsedsize']
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

    // Zero miss-spam for the legacy names. Targeted (not blanket
    // zero-warnings): the H-6 dev-race can warn for values whose rules exist,
    // so only the leak signature fails here.
    const leak = /minSize|maxSize|collapsible|collapsedSize/
    expect(errors.filter(t => leak.test(t))).toEqual([])
    expect(warnings.filter(t => leak.test(t))).toEqual([])
  })

  test('W-35: bad panel layout dev-warns and never silently collapses', async ({ mount, page }) => {
    // B-11 instance shape: entries sum to 60, not 100. Dev warns naming
    // component, prop, value, and range; both panels stay measurable —
    // never the silent ~13px collapse dist shipped.
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', err => errors.push(String(err)))
    await mount('components/Splitter/Splitter/BadLayout')

    await expect(page.getByTestId('badlayout-panel-0')).toBeVisible()
    await expect(page.getByTestId('badlayout-panel-1')).toBeVisible()
    expect(
      errors.some(
        t =>
          t.includes('Splitter') &&
          t.includes('value') &&
          t.includes('60.00%') &&
          t.includes('100%')
      )
    ).toBe(true)

    const widths = await page.evaluate(() =>
      [...document.querySelectorAll('[data-reference-splitter-panel]')].map(
        el => (el as HTMLElement).getBoundingClientRect().width
      )
    )
    expect(widths).toHaveLength(2)
    expect(widths.every(w => w > 13)).toBe(true)
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
      userSelect: document.body.style.userSelect,
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
            ariaDisabled: el.getAttribute('aria-disabled'),
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
    // FEATURES #7 (focusable-but-inert): the explicitly disabled Handle
    // keeps its tab stop and reports aria-disabled; feasible Handles have
    // neither hook.
    const mixedDisabled = sweep.rows.find((r) => r.testId === 'a11y-mixed-handle-1')!
    expect(mixedDisabled.disabled).toBe('')
    expect(mixedDisabled.tabIndex).toBe(0)
    expect(mixedDisabled.ariaDisabled).toBe('true')
    for (const row of sweep.rows) {
      if (row.testId === 'a11y-mixed-handle-1') continue
      expect(row.tabIndex).toBe(0)
      expect(row.disabled).toBeNull()
      expect(row.ariaDisabled).toBeNull()
    }
    expect(sweep.collapsedHook).toBe(true)
  })
})

test.describe('Splitter FEATURES #9: strict structural errors', () => {
  test('SP-DOM-02: Malformed trees throw descriptive anatomy errors with no resize surface left behind', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/StructureErrors')

    // Each variant reports its own defect through the boundary.
    await expect(page.getByTestId('structure-error-leading-handle')).toContainText(
      'need exactly 1 Handle, but 2 are mounted'
    )
    await expect(page.getByTestId('structure-error-trailing-handle')).toContainText(
      'need exactly 1 Handle, but 2 are mounted'
    )
    await expect(page.getByTestId('structure-error-consecutive-handles')).toContainText(
      'need exactly 1 Handle, but 2 are mounted'
    )
    await expect(page.getByTestId('structure-error-consecutive-panels')).toContainText(
      'need exactly 1 Handle, but 0 are mounted'
    )
    await expect(page.getByTestId('structure-error-one-panel')).toContainText(
      'only one is mounted'
    )
    await expect(page.getByTestId('structure-error-value-short')).toContainText(
      'value has 1 entry but 2 Panels are mounted'
    )
    await expect(page.getByTestId('structure-error-value-long')).toContainText(
      'value has 3 entries but 2 Panels are mounted'
    )
    await expect(page.getByTestId('structure-error-misordered')).toContainText(
      'strictly alternate'
    )
    await expect(page.getByTestId('structure-error-misordered')).toContainText(
      'panel → panel → handle'
    )

    // Nothing remains: no separator ARIA, no capture, no document lock.
    await expect(page.locator('[role="separator"]')).toHaveCount(0)
    await expect(page.locator('[data-resizing]')).toHaveCount(0)
    const styles = await page.evaluate(() => ({
      userSelect: document.body.style.userSelect,
      cursor: document.body.style.cursor,
    }))
    expect(styles).toEqual({ userSelect: '', cursor: '' })
  })
})

test.describe('Splitter FEATURES #4: CSS-variable geometry contract', () => {
  test('SP-DOM-09: Panels publish percentages and Root publishes indexed sizes, updated atomically', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Basic')

    const vars = () =>
      page.evaluate(() => {
        const root = document.querySelector('[data-testid="test-splitter"]') as HTMLElement
        const panels = [...root.querySelectorAll('[data-reference-splitter-panel]')] as HTMLElement[]
        return {
          panel: panels.map((p) => p.style.getPropertyValue('--reference-splitter-panel-size')),
          root1: root.style.getPropertyValue('--reference-splitter-1'),
          root2: root.style.getPropertyValue('--reference-splitter-2'),
          panelClass: panels[0]?.getAttribute('class') ?? '',
        }
      })

    expect(await vars()).toMatchObject({ panel: ['40%', '60%'], root1: '40%', root2: '60%' })
    const before = (await vars()).panelClass

    // One key rerenders Panel vars, Root vars, and Handle ARIA together.
    await page.getByTestId('splitter-handle-0').focus()
    await page.keyboard.press('ArrowRight')
    expect(await vars()).toMatchObject({ panel: ['41%', '59%'], root1: '41%', root2: '59%' })
    await expect(page.getByTestId('splitter-handle-0')).toHaveAttribute('aria-valuenow', '41')
    // Consumer styling is untouched by the kernel-owned rewrite.
    expect((await vars()).panelClass).toBe(before)
  })

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

  test('SP-DOM-13: Panels size from the variable with owned flex; Handles stay fixed', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Basic')

    const horizontal = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="test-splitter"]') as HTMLElement
      const panel = document.querySelector('[data-testid="splitter-panel-0"]') as HTMLElement
      const handle = document.querySelector('[data-testid="splitter-handle-0"]') as HTMLElement
      const cs = (el: HTMLElement) => getComputedStyle(el)
      return {
        rootDisplay: cs(root).display,
        rootDirection: cs(root).flexDirection,
        grow: cs(panel).flexGrow,
        shrink: cs(panel).flexShrink,
        basis: cs(panel).flexBasis,
        minWidth: cs(panel).minWidth,
        handleGrow: cs(handle).flexGrow,
        handleShrink: cs(handle).flexShrink,
        handleBasis: cs(handle).flexBasis,
        inlineFlex: panel.style.flex,
      }
    })
    expect(horizontal.rootDisplay).toBe('flex')
    expect(horizontal.rootDirection).toBe('row')
    expect(horizontal.grow).toBe('1')
    expect(horizontal.shrink).toBe('1')
    // flex-basis is the resolved 40% variable (percentages stay percentages
    // in computed style; layout resolves them against the flex container).
    expect(horizontal.basis).toBe('40%')
    expect(horizontal.minWidth).toBe('0px')
    expect(horizontal.handleGrow).toBe('0')
    expect(horizontal.handleShrink).toBe('0')
    expect(horizontal.handleBasis).toBe('auto')
    expect(horizontal.inlineFlex).toContain('var(--reference-splitter-panel-size)')

    await mount('components/Splitter/Splitter/Vertical')
    const vertical = await page.evaluate(() => {
      const panel = document.querySelector(
        '[data-testid="splitter-vertical-root"] [data-reference-splitter-panel]'
      ) as HTMLElement
      return {
        direction: getComputedStyle(panel.parentElement as HTMLElement).flexDirection,
        minHeight: getComputedStyle(panel).minHeight,
      }
    })
    expect(vertical.direction).toBe('column')
    expect(vertical.minHeight).toBe('0px')
  })
})

test.describe('Splitter FEATURES #7: Handle determinism', () => {
  test('SP-DOM-08: Feasible Handles tab in DOM order; explicit and infeasible Handles are aria-disabled but focusable', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Blocked')
    const first = page.getByTestId('blocked-handle-0')
    const second = page.getByTestId('blocked-handle-1')

    // Both feasible: tab stops in DOM order, no disabled semantics.
    await expect(first).toHaveAttribute('tabindex', '0')
    await expect(second).toHaveAttribute('tabindex', '0')
    await expect(first).not.toHaveAttribute('aria-disabled', 'true')
    await expect(second).not.toHaveAttribute('aria-disabled', 'true')
    await first.focus()
    await page.keyboard.press('Tab')
    const order = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(order).toBe('blocked-handle-1')

    // Disable one explicitly; pin the other's neighbors so no delta is feasible.
    await page.getByTestId('blocked-toggle-disabled').click()
    await page.getByTestId('blocked-toggle-pinned').click()

    // Focusable-but-inert: tab stops stay, action reports aria-disabled.
    await expect(first).toHaveAttribute('tabindex', '0')
    await expect(second).toHaveAttribute('tabindex', '0')
    await expect(first).toHaveAttribute('aria-disabled', 'true')
    await expect(second).toHaveAttribute('aria-disabled', 'true')
    await expect(first).toHaveAttribute('data-disabled', '')
    await expect(second).not.toHaveAttribute('data-disabled', '')

    // Neither requests resize on drag.
    const at = await handleCenter(page, 'blocked-handle-0')
    await page.mouse.move(at.x, at.y)
    await page.mouse.down()
    await page.mouse.move(at.x + 60, at.y, { steps: 4 })
    await page.mouse.up()
    const at2 = await handleCenter(page, 'blocked-handle-1')
    await page.mouse.move(at2.x, at2.y)
    await page.mouse.down()
    await page.mouse.move(at2.x - 60, at2.y, { steps: 4 })
    await page.mouse.up()
    await expect(page.getByTestId('blocked-change-count')).toHaveText('0')
    await expect(page.getByTestId('blocked-value-display')).toHaveText('Layout: 20% / 30% / 50%')

    // Tab order stays pinned in DOM order.
    await first.focus()
    await page.keyboard.press('Tab')
    const pinned = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))
    expect(pinned).toBe('blocked-handle-1')
  })

  test('SP-KEY-06: Disabled and blocked Handles consume no resize key', async ({ mount, page }) => {
    await mount('components/Splitter/Splitter/Blocked')
    await page.getByTestId('blocked-toggle-disabled').click()
    await page.getByTestId('blocked-toggle-pinned').click()

    for (const testId of ['blocked-handle-0', 'blocked-handle-1']) {
      await page.getByTestId(testId).focus()
      for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End', 'Enter']) {
        const unprevented = await dispatchKey(page, testId, 'keydown', { key })
        expect(unprevented).toBe(true)
      }
      await dispatchKey(page, testId, 'keyup', { key: 'ArrowRight' })
      // Focus never leaves; nothing changed.
      const focused = await page.evaluate(
        (id) => document.activeElement?.getAttribute('data-testid') === id,
        testId
      )
      expect(focused).toBe(true)
    }
    await expect(page.getByTestId('blocked-change-count')).toHaveText('0')
    await expect(page.getByTestId('blocked-change-end-count')).toHaveText('0')
    await expect(page.getByTestId('blocked-value-display')).toHaveText('Layout: 20% / 30% / 50%')
    await expect(page.getByTestId('blocked-handle-0')).toHaveAttribute('aria-valuenow', '20')
    await expect(page.getByTestId('blocked-handle-1')).toHaveAttribute('aria-valuenow', '30')
  })
})

test.describe('Splitter FEATURES #3/#8: measured constraints over the Panel-axis sum', () => {
  test('SP-DYNAMIC-02: Idle resize re-resolves measured bounds and ARIA without touching value or callbacks', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Measured')
    const handle = page.getByTestId('measured-handle-0')

    // 500px of Panel space: 120px is 24, 450px is 90 — the 1px Handle is
    // excluded from the denominator (501 would read 23.952/89.82).
    await expect(handle).toHaveAttribute('aria-valuenow', '40')
    await expect(handle).toHaveAttribute('aria-valuemin', '24')
    await expect(handle).toHaveAttribute('aria-valuemax', '90')

    await page.getByTestId('measured-toggle-width').click()

    // 1000px now: bounds halve, hooks stay, nothing is requested.
    await expect(handle).toHaveAttribute('aria-valuemin', '12')
    await expect(handle).toHaveAttribute('aria-valuemax', '45')
    await expect(handle).toHaveAttribute('aria-valuenow', '40')
    await expect(page.getByTestId('measured-value-display')).toHaveText('Layout: 40% / 60%')
    await expect(page.getByTestId('measured-change-count')).toHaveText('0')
    await expect(page.getByTestId('measured-change-end-count')).toHaveText('0')
    const hooks = await page.evaluate(() => {
      const panels = [
        ...document.querySelectorAll('[data-testid="test-splitter-measured"] [data-reference-splitter-panel]'),
      ] as HTMLElement[]
      return panels.map((p) => p.style.getPropertyValue('--reference-splitter-panel-size'))
    })
    expect(hooks).toEqual(['40%', '60%'])
  })

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
    await page.mouse.move(at.x, at.y + 120, { steps: 6 })
    const during = await page.evaluate(() => ({
      cursor: document.body.style.cursor,
      userSelect: document.body.style.userSelect,
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

  test('SP-DRAG-03: Vertical drag maps to the Panel above identically in LTR and RTL', async ({
    mount,
    page,
  }) => {
    // Same-story mounts reconcile onto one root and keep state, so each
    // run unmounts first for a fresh [70,30].
    const run1 = await mount('components/Splitter/Splitter/MeasuredVertical')
    const down = await handleCenter(page, 'measured-v-handle-0')
    await page.mouse.move(down.x, down.y)
    await page.mouse.down()
    await page.mouse.move(down.x, down.y + 50, { steps: 4 })
    await page.mouse.up()
    await expect(page.getByTestId('measured-v-last-request')).toHaveText('76,24')
    await run1.unmount()

    const run2 = await mount('components/Splitter/Splitter/MeasuredVertical')
    const up = await handleCenter(page, 'measured-v-handle-0')
    await page.mouse.move(up.x, up.y)
    await page.mouse.down()
    await page.mouse.move(up.x, up.y - 50, { steps: 4 })
    await page.mouse.up()
    await expect(page.getByTestId('measured-v-last-request')).toHaveText('60,40')
    await run2.unmount()

    // RTL changes nothing vertically: same mapping, above Panel primary.
    await mount('components/Splitter/Splitter/MeasuredVertical')
    await page.evaluate(() => {
      document.dir = 'rtl'
    })
    try {
      const rtl = await handleCenter(page, 'measured-v-handle-0')
      await page.mouse.move(rtl.x, rtl.y)
      await page.mouse.down()
      await page.mouse.move(rtl.x, rtl.y + 50, { steps: 4 })
      await page.mouse.up()
      await expect(page.getByTestId('measured-v-last-request')).toHaveText('76,24')
      await expect(page.getByTestId('measured-v-handle-0')).toHaveAttribute(
        'aria-orientation',
        'horizontal'
      )
      const controls = await page.getByTestId('measured-v-handle-0').getAttribute('aria-controls')
      expect(controls).toBe(await page.getByTestId('measured-v-panel-0').getAttribute('id'))
    } finally {
      await page.evaluate(() => {
        document.dir = ''
      })
    }
  })
})

test.describe('Splitter FEATURES #6: collapse memory and dynamic panels', () => {
  test('SP-COLLAPSE-05: Programmatic value changes cross the collapse boundary silently', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Dynamic')
    const handle = page.getByTestId('dynamic-handle-0')
    await handle.focus()

    // Programmatic clicks (no focus steal) so focus retention is meaningful.
    const toggleProgrammatic = () =>
      page.evaluate(() =>
        (document.querySelector('[data-testid="dynamic-op-programmatic"]') as HTMLElement).click()
      )
    await toggleProgrammatic()
    await expect(page.getByTestId('dynamic-value-display')).toHaveText('Layout: 5% / 60% / 35%')
    await expect(page.getByTestId('dynamic-panel-a')).toHaveAttribute('data-collapsed', '')
    await expect(handle).toHaveAttribute('aria-valuenow', '5')
    await expect(page.getByTestId('dynamic-change-count')).toHaveText('0')
    await expect(page.getByTestId('dynamic-change-end-count')).toHaveText('0')
    const focused = await page.evaluate(
      () => document.activeElement?.getAttribute('data-testid') === 'dynamic-handle-0'
    )
    expect(focused).toBe(true)

    await toggleProgrammatic()
    await expect(page.getByTestId('dynamic-value-display')).toHaveText('Layout: 30% / 35% / 35%')
    await expect(page.getByTestId('dynamic-panel-a')).not.toHaveAttribute('data-collapsed', '')
    await expect(page.getByTestId('dynamic-change-count')).toHaveText('0')
  })

  test('SP-COLLAPSE-06: Restore memory keys to stable Panel IDs across reorder, remove, insert, and reinsert', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Dynamic')
    const requests = page.getByTestId('dynamic-last-request')

    // Collapse A from 30: memory records 30 under A's stable id.
    await page.getByTestId('dynamic-handle-0').focus()
    await page.keyboard.press('Enter')
    await expect(requests).toHaveText('5,60,35')

    // Atomic reorder to B/A/C: sizes follow position, memory follows A.
    await page.getByTestId('dynamic-op-reorder').click()
    await expect(page.getByTestId('dynamic-value-display')).toHaveText('Layout: 60% / 5% / 35%')
    await expect(page.getByTestId('dynamic-panel-a')).toHaveText('A (5%)')
    await expect(page.getByTestId('dynamic-change-count')).toHaveText('1')
    await page.getByTestId('dynamic-handle-1').focus()
    await page.keyboard.press('Enter')
    await expect(requests).toHaveText('60,30,10')

    // Remove A: B and C keep their own sizes; A's memory stays isolated.
    await page.getByTestId('dynamic-op-remove-a').click()
    await expect(page.getByTestId('dynamic-value-display')).toHaveText('Layout: 70% / 30%')
    await expect(page.getByTestId('dynamic-change-count')).toHaveText('2')

    // Insert D: collapsing and restoring D uses D's own memory, never A's 30.
    await page.getByTestId('dynamic-op-insert-d').click()
    await expect(page.getByTestId('dynamic-value-display')).toHaveText('Layout: 60% / 20% / 20%')
    await page.getByTestId('dynamic-handle-1').focus()
    await page.keyboard.press('Enter')
    await expect(requests).toHaveText('60,5,35')
    await page.keyboard.press('Enter')
    await expect(requests).toHaveText('60,20,20')

    // Reinsert A with its stable id: MUST recover A's remembered 30.
    await page.getByTestId('dynamic-op-reinsert-a').click()
    await expect(page.getByTestId('dynamic-value-display')).toHaveText('Layout: 5% / 60% / 20% / 15%')
    await page.getByTestId('dynamic-handle-0').focus()
    await page.keyboard.press('Enter')
    await expect(requests).toHaveText('30,35,20,15')
    await expect(page.getByTestId('dynamic-change-count')).toHaveText('5')
    await expect(page.getByTestId('dynamic-panel-a')).not.toHaveAttribute('data-collapsed', '')
  })

  test('SP-DYNAMIC-01: Atomic insert, remove, and reorder keep IDs, ARIA, and callbacks consistent', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Dynamic')

    await page.getByTestId('dynamic-handle-0').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('dynamic-last-request')).toHaveText('5,60,35')

    await page.getByTestId('dynamic-op-reorder').click()
    // Handle adjacency and ARIA rebuild around the new order: handle 1 now
    // drives A, the collapsed primary.
    const controls = await page.getByTestId('dynamic-handle-1').getAttribute('aria-controls')
    expect(controls).toBe('dynamic-panel-id-a')
    await expect(page.getByTestId('dynamic-handle-1')).toHaveAttribute('aria-valuenow', '5')
    await expect(page.getByTestId('dynamic-handle-0')).toHaveAttribute('aria-valuenow', '60')
    // No unsolicited callback: only the Enter requested.
    await expect(page.getByTestId('dynamic-change-count')).toHaveText('1')
    await expect(page.getByTestId('dynamic-change-end-count')).toHaveText('1')

    await page.getByTestId('dynamic-op-remove-a').click()
    await expect(page.getByTestId('dynamic-value-display')).toHaveText('Layout: 70% / 30%')
    await expect(page.getByTestId('dynamic-change-count')).toHaveText('1')
    // The surviving boundary still resizes: one request, one end.
    await page.getByTestId('dynamic-handle-0').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('dynamic-last-request')).toHaveText('71,29')
    await expect(page.getByTestId('dynamic-change-end-count')).toHaveText('2')
  })

  test('SP-DYNAMIC-03: Transiently invalid trees fail locally with a diagnostic, then restore cleanly', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Dynamic')

    // Hide the middle Panel while its Handles stay: consecutive Handles,
    // plus 3 value entries over 2 Panels. The validator reports the
    // value/Panel count mismatch first; either way the tree fails locally.
    await page.getByTestId('dynamic-op-hide-b').click()
    await expect(page.getByTestId('dynamic-structure-error')).toContainText(
      'value has 3 entries but 2 Panels are mounted'
    )
    // No capture, cursor, listener, or ARIA survives the failure.
    await expect(page.locator('[data-testid="splitter-dynamic-root"] [role="separator"]')).toHaveCount(0)
    const failed = await page.evaluate(() => ({
      resizing: document.querySelectorAll('[data-resizing]').length,
      userSelect: document.body.style.userSelect,
      cursor: document.body.style.cursor,
    }))
    expect(failed).toEqual({ resizing: 0, userSelect: '', cursor: '' })
    await expect(page.getByTestId('dynamic-change-count')).toHaveText('0')

    // Restore: the next drag uses current geometry once.
    await page.getByTestId('dynamic-op-hide-b').click()
    await expect(page.getByTestId('dynamic-handle-0')).toBeVisible()
    const at = await handleCenter(page, 'dynamic-handle-0')
    await page.mouse.move(at.x, at.y)
    await page.mouse.down()
    await page.mouse.move(at.x + 40, at.y, { steps: 4 })
    await page.mouse.up()
    await expect(page.getByTestId('dynamic-value-display')).toHaveText('Layout: 40% / 25% / 35%')
    await expect(page.getByTestId('dynamic-change-end-count')).toHaveText('1')
  })

  test('SP-COLLAPSE-04: A pointer drag away from collapsed size refreshes restore memory', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/CollapsibleDemo')
    const handle = page.getByTestId('collapsible-handle-0')
    const requests = page.getByTestId('collapsible-last-request')

    await handle.focus()
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('ArrowLeft')
    }
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('collapsible-value-display')).toHaveText('Layout: 5% / 95%')

    // Drag away from collapsed: hooks clear and memory takes the drag size.
    const at = await handleCenter(page, 'collapsible-handle-0')
    await page.mouse.move(at.x, at.y)
    await page.mouse.down()
    await page.mouse.move(at.x + 100, at.y, { steps: 5 })
    await page.mouse.up()
    await expect(page.getByTestId('collapsible-panel-0')).not.toHaveAttribute('data-collapsed', '')
    const dragged = await requests.innerText()
    expect(dragged).not.toBe('40,60')

    // Collapse, then restore: the newest accepted expanded size returns.
    await handle.focus()
    await page.keyboard.press('Enter')
    await expect(requests).toHaveText('5,95')
    await page.keyboard.press('Enter')
    await expect(requests).toHaveText(dragged)
  })
})

test.describe('Splitter FEATURES #5: pointer-session frame budget', () => {
  test('SP-PERF-01: Pointermove commits no React on Panel descendants and never toggles resizing', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/PerfRejected')
    const center = await handleCenter(page, 'perf-handle-0')
    await recordNextPointerId(page, 'perf-handle-0')

    await page.mouse.move(center.x, center.y)
    await page.mouse.down()
    await expect(page.getByTestId('test-splitter-perf')).toHaveAttribute('data-resizing', '')
    // Settle the pointerdown commit, then record descendant commit counts and
    // arm a resizing-attribute mutation observer.
    await page.waitForTimeout(150)
    await page.evaluate(() => {
      const w = window as unknown as { __spResizingToggles?: number }
      w.__spResizingToggles = 0
      const root = document.querySelector('[data-testid="test-splitter-perf"]') as HTMLElement
      new MutationObserver((records) => {
        w.__spResizingToggles = (w.__spResizingToggles ?? 0) + records.length
      }).observe(root, { attributes: true, attributeFilter: ['data-resizing'] })
    })
    const before = await page.evaluate(
      () => ({ ...(window as unknown as { __spCommits: Record<string, number> }).__spCommits })
    )
    const pointerId = await lastPointerId(page)

    // 30 moves that each change the candidate; the parent never setStates.
    await page.evaluate(
      ({ pointerId, center }) => {
        for (let step = 1; step <= 30; step++) {
          window.dispatchEvent(
            new PointerEvent('pointermove', {
              pointerId,
              buttons: 1,
              clientX: center.x + step * 4,
              clientY: center.y,
              bubbles: true,
              cancelable: true,
            })
          )
        }
      },
      { pointerId, center }
    )
    await page.waitForTimeout(100)
    const after = await page.evaluate(
      () => ({ ...(window as unknown as { __spCommits: Record<string, number> }).__spCommits })
    )
    expect(after).toEqual(before)
    const toggles = await page.evaluate(
      () => (window as unknown as { __spResizingToggles: number }).__spResizingToggles
    )
    expect(toggles).toBe(0)
    // Every move still requested (rejected): the loop ran, commits did not.
    const requests = await page.evaluate(
      () => (window as unknown as { __spRequests: string[] }).__spRequests.length
    )
    expect(requests).toBe(30)

    await page.mouse.up()
  })

  test('SP-PERF-02: Pointermove reads no layout after the session captures geometry', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Constrained')
    const center = await handleCenter(page, 'constrained-handle-0')
    await recordNextPointerId(page, 'constrained-handle-0')

    await page.mouse.move(center.x, center.y)
    await page.mouse.down()
    await expect(page.getByTestId('test-splitter-constrained')).toHaveAttribute('data-resizing', '')
    const pointerId = await lastPointerId(page)

    // Spy the layout-read surface from here: moves must add zero calls.
    await page.evaluate(() => {
      const w = window as unknown as {
        __spReads: Record<string, number>
        __spOrig: Record<string, unknown>
      }
      w.__spReads = { rect: 0, computed: 0, offsetWidth: 0, offsetHeight: 0 }
      w.__spOrig = {}
      const origRect = Element.prototype.getBoundingClientRect
      w.__spOrig.rect = origRect
      Element.prototype.getBoundingClientRect = function (...args: []) {
        w.__spReads.rect += 1
        return (origRect as (...a: []) => DOMRect).apply(this, args)
      }
      const origComputed = window.getComputedStyle
      w.__spOrig.computed = origComputed
      window.getComputedStyle = ((...args: [Element]) => {
        w.__spReads.computed += 1
        return (origComputed as (...a: [Element]) => CSSStyleDeclaration)(...args)
      }) as typeof window.getComputedStyle
      for (const key of ['offsetWidth', 'offsetHeight'] as const) {
        let proto: object | null = HTMLElement.prototype
        while (proto && !Object.getOwnPropertyDescriptor(proto, key)) {
          proto = Object.getPrototypeOf(proto)
        }
        if (!proto) continue
        const desc = Object.getOwnPropertyDescriptor(proto, key) as PropertyDescriptor
        w.__spOrig[key] = desc
        Object.defineProperty(proto, key, {
          configurable: true,
          enumerable: desc.enumerable,
          get(this: HTMLElement) {
            w.__spReads[key] += 1
            return (desc.get as () => number).call(this)
          },
        })
      }
    })

    // Absolute-coordinate moves: the test itself reads no layout either.
    await page.evaluate(
      ({ pointerId, center }) => {
        for (let step = 1; step <= 20; step++) {
          window.dispatchEvent(
            new PointerEvent('pointermove', {
              pointerId,
              buttons: 1,
              clientX: center.x + step * 4,
              clientY: center.y,
              bubbles: true,
              cancelable: true,
            })
          )
        }
      },
      { pointerId, center }
    )
    const reads = await page.evaluate(
      () => (window as unknown as { __spReads: Record<string, number> }).__spReads
    )
    expect(reads).toEqual({ rect: 0, computed: 0, offsetWidth: 0, offsetHeight: 0 })

    await page.mouse.up()
  })

  test('SP-PERF-03: Separator ARIA stays frozen during an accepted drag, then matches the last candidate', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Constrained')
    const handle = page.getByTestId('constrained-handle-0')
    await expect(handle).toHaveAttribute('aria-valuenow', '40')
    await expect(handle).toHaveAttribute('aria-valuemin', '20')
    await expect(handle).toHaveAttribute('aria-valuemax', '60')

    const center = await handleCenter(page, 'constrained-handle-0')
    await page.mouse.move(center.x, center.y)
    await page.mouse.down()
    await page.mouse.move(center.x + 20, center.y, { steps: 2 })
    await page.mouse.move(center.x + 40, center.y, { steps: 2 })
    await page.mouse.move(center.x + 60, center.y, { steps: 2 })
    // Three distinct accepted candidates; ARIA never moved mid-gesture.
    await expect(page.getByTestId('change-count')).not.toHaveText('0')
    const frozen = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="constrained-handle-0"]') as HTMLElement
      return {
        now: el.getAttribute('aria-valuenow'),
        min: el.getAttribute('aria-valuemin'),
        max: el.getAttribute('aria-valuemax'),
      }
    })
    expect(frozen).toEqual({ now: '40', min: '20', max: '60' })

    await page.mouse.up()
    await expect(handle).toHaveAttribute('aria-valuenow', '55')
    await expect(handle).toHaveAttribute('aria-valuemin', '20')
    await expect(handle).toHaveAttribute('aria-valuemax', '60')
  })

  test('SP-PERF-04: Changed moves write CSS size signals synchronously, ahead of the delayed value', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/DelayedEcho')
    const center = await handleCenter(page, 'delayed-handle-0')
    await recordNextPointerId(page, 'delayed-handle-0')

    await page.mouse.move(center.x, center.y)
    await page.mouse.down()
    const pointerId = await lastPointerId(page)

    // Dispatch and read inside one turn: the ref write lands before rAF.
    const seen = await page.evaluate(
      ({ pointerId, center }) => {
        window.dispatchEvent(
          new PointerEvent('pointermove', {
            pointerId,
            buttons: 1,
            clientX: center.x + 50,
            clientY: center.y,
            bubbles: true,
            cancelable: true,
          })
        )
        const root = document.querySelector('[data-testid="test-splitter-delayed"]') as HTMLElement
        const panels = [...root.querySelectorAll('[data-reference-splitter-panel]')] as HTMLElement[]
        return {
          panel0: panels[0]?.style.getPropertyValue('--reference-splitter-panel-size'),
          panel1: panels[1]?.style.getPropertyValue('--reference-splitter-panel-size'),
          root1: root.style.getPropertyValue('--reference-splitter-1'),
          display: document.querySelector('[data-testid="delayed-value-display"]')?.textContent,
        }
      },
      { pointerId, center }
    )
    expect(seen).toMatchObject({ panel0: '52.531%', panel1: '47.469%', root1: '52.531%' })
    expect(seen.display).toContain('Layout: 40% / 60%')

    // Lift where the gesture finished: release re-solves at the lift point,
    // so lifting at the untouched origin would end at [40,60].
    await page.mouse.move(center.x + 50, center.y)
    await page.mouse.up()
    await expect(page.getByTestId('delayed-ends')).toHaveText('52.531,47.469')
  })

  test('SP-PERF-05: No requestAnimationFrame polling while idle or to produce drag frames', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Constrained')
    await page.evaluate(() => {
      const w = window as unknown as { __spRaf: number; __spOrigRaf: typeof requestAnimationFrame }
      w.__spRaf = 0
      w.__spOrigRaf = window.requestAnimationFrame
      window.requestAnimationFrame = ((...args: [FrameRequestCallback]) => {
        w.__spRaf += 1
        return (w.__spOrigRaf as (...a: [FrameRequestCallback]) => number)(...args)
      }) as typeof requestAnimationFrame
    })

    await page.waitForTimeout(300)
    const center = await handleCenter(page, 'constrained-handle-0')
    await page.mouse.move(center.x, center.y)
    await page.mouse.down()
    await page.mouse.move(center.x + 40, center.y, { steps: 4 })
    await page.mouse.up()
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 50% / 50%')

    const calls = await page.evaluate(
      () => (window as unknown as { __spRaf: number }).__spRaf
    )
    expect(calls).toBe(0)
  })

  test('SP-PERF-06: Measured constraints resolve at pointerdown; mid-gesture root changes wait for the next session', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/MeasuredR')
    const handle = page.getByTestId('measuredr-handle-0')

    // 12r at the pinned 4px root is 48px of 400px: exactly 12.
    await expect(handle).toHaveAttribute('aria-valuenow', '40')
    await expect(handle).toHaveAttribute('aria-valuemin', '12')
    await expect(handle).toHaveAttribute('aria-valuemax', '40')

    // Hold a synthetic drag so the mouse stays free for the mid-gesture swap.
    await dispatchPointer(
      page,
      'measuredr-handle-0',
      'pointerdown',
      { pointerId: 7, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1 }
    )
    await page.getByTestId('measuredr-toggle-spacing').click()
    // 12r would now be 96px (24 points), but the session keeps its capture.
    await dispatchPointer(
      page,
      'measuredr-handle-0',
      'pointermove',
      { pointerId: 7, buttons: 1, dx: -200 },
      'window'
    )
    await expect(page.getByTestId('measuredr-last-request')).toHaveText('12,88')
    await dispatchPointer(
      page,
      'measuredr-handle-0',
      'pointerup',
      { pointerId: 7, buttons: 0, dx: -200 },
      'window'
    )
    await expect(page.getByTestId('measuredr-change-end-count')).toHaveText('1')

    // The next session captures the new 8px root: min is 24.
    await dispatchPointer(
      page,
      'measuredr-handle-0',
      'pointerdown',
      { pointerId: 7, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1 }
    )
    await dispatchPointer(
      page,
      'measuredr-handle-0',
      'pointermove',
      { pointerId: 7, buttons: 1, dx: -200 },
      'window'
    )
    await expect(page.getByTestId('measuredr-last-request')).toHaveText('24,76')
    await dispatchPointer(
      page,
      'measuredr-handle-0',
      'pointerup',
      { pointerId: 7, buttons: 0, dx: -200 },
      'window'
    )
    await expect(handle).toHaveAttribute('aria-valuemin', '24')
  })

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
      userSelect: document.body.style.userSelect,
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
      userSelect: document.body.style.userSelect,
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

test.describe('Splitter controlled sessions and compositions', () => {
  test('SP-CTRL-01: Pointer and keyboard resize each request one complete normalized array', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Sidebar')

    const at = await handleCenter(page, 'sidebar-handle-0')
    await page.mouse.move(at.x, at.y)
    await page.mouse.down()
    await page.mouse.move(at.x + 40, at.y, { steps: 4 })
    await page.mouse.up()
    const dragRequest = (await page.getByTestId('sidebar-last-request').innerText())
      .split(',')
      .map(Number)
    expect(dragRequest).toHaveLength(2)
    expect(dragRequest.every((entry) => Number.isFinite(entry) && entry >= 0)).toBe(true)
    expect(dragRequest[0]! + dragRequest[1]!).toBeCloseTo(100, 3)

    await page.getByTestId('sidebar-handle-0').focus()
    await page.keyboard.press('ArrowLeft')
    const keyRequest = (await page.getByTestId('sidebar-last-request').innerText())
      .split(',')
      .map(Number)
    expect(keyRequest).toHaveLength(2)
    expect(keyRequest.every((entry) => Number.isFinite(entry) && entry >= 0)).toBe(true)
    expect(keyRequest[0]! + keyRequest[1]!).toBeCloseTo(100, 3)
  })

  test('SP-CTRL-02: Rejected gestures follow the solver on CSS signals, then snap back to value', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Rejecting')

    await dispatchPointer(
      page,
      'rejecting-handle-0',
      'pointerdown',
      { pointerId: 7, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1 }
    )
    // Move endpoint in absolute coords: the move resizes Panels (the Handle
    // travels with them), so dx-relative addressing would double-count.
    const origin = await page.getByTestId('rejecting-handle-0').boundingBox()
    const endX = (origin?.x ?? 0) + (origin?.width ?? 0) / 2 + 50
    const endY = (origin?.y ?? 0) + (origin?.height ?? 0) / 2
    // 50px of 399px Panel space: the request is exactly [52.531, 47.469].
    await dispatchPointer(
      page,
      'rejecting-handle-0',
      'pointermove',
      { pointerId: 7, buttons: 1, xy: { x: endX, y: endY } },
      'window'
    )
    await expect(page.getByTestId('rejecting-requests')).toHaveText('A:[52.531,47.469]')
    const during = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="test-splitter-rejecting"]') as HTMLElement
      const panels = [...root.querySelectorAll('[data-reference-splitter-panel]')] as HTMLElement[]
      const handle = document.querySelector('[data-testid="rejecting-handle-0"]') as HTMLElement
      return {
        panel0: panels[0]?.style.getPropertyValue('--reference-splitter-panel-size'),
        panel1: panels[1]?.style.getPropertyValue('--reference-splitter-panel-size'),
        now: handle.getAttribute('aria-valuenow'),
      }
    })
    expect(during).toEqual({ panel0: '52.531%', panel1: '47.469%', now: '40' })

    await dispatchPointer(
      page,
      'rejecting-handle-0',
      'pointerup',
      { pointerId: 7, buttons: 0, xy: { x: endX, y: endY } },
      'window'
    )
    await expect(page.getByTestId('rejecting-ends')).toHaveText('A:[52.531,47.469]')
    const snapped = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="test-splitter-rejecting"]') as HTMLElement
      const panels = [...root.querySelectorAll('[data-reference-splitter-panel]')] as HTMLElement[]
      const handle = document.querySelector('[data-testid="rejecting-handle-0"]') as HTMLElement
      return {
        panel0: panels[0]?.style.getPropertyValue('--reference-splitter-panel-size'),
        panel1: panels[1]?.style.getPropertyValue('--reference-splitter-panel-size'),
        root1: root.style.getPropertyValue('--reference-splitter-1'),
        now: handle.getAttribute('aria-valuenow'),
      }
    })
    expect(snapped).toEqual({ panel0: '40%', panel1: '60%', root1: '40%', now: '40' })
  })

  test('SP-CTRL-04: Constrained no-ops request nothing and keep focus, ARIA, and hooks', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Constrained')
    const handle = page.getByTestId('constrained-handle-0')
    const changes = page.getByTestId('change-count')

    await handle.focus()
    await page.keyboard.press('End')
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 60% / 40%')
    // The setup key ends its own session; the no-op drag below must add none.
    const before = await changes.innerText()
    const beforeEnd = await page.getByTestId('change-end-count').innerText()

    // Drag farther past the bound: silent, stable, still resizing-styled.
    const at = await handleCenter(page, 'constrained-handle-0')
    await page.mouse.move(at.x, at.y)
    await page.mouse.down()
    await page.mouse.move(at.x + 80, at.y, { steps: 4 })
    const during = await page.evaluate(() => ({
      cursor: document.body.style.cursor,
      resizing: document
        .querySelector('[data-testid="test-splitter-constrained"]')
        ?.hasAttribute('data-resizing'),
    }))
    expect(during).toEqual({ cursor: 'col-resize', resizing: true })
    await page.mouse.up()

    await expect(changes).toHaveText(before)
    await expect(page.getByTestId('change-end-count')).toHaveText(beforeEnd)
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 60% / 40%')
    await expect(handle).toHaveAttribute('aria-valuenow', '60')
    const focused = await page.evaluate(
      () => document.activeElement?.getAttribute('data-testid') === 'constrained-handle-0'
    )
    expect(focused).toBe(true)
  })

  test('SP-CTRL-05: Mid-drag echoes never rebase the origin while live numerics and handlers apply', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Rejecting')
    const origin = await handleCenter(page, 'rejecting-handle-0')

    await dispatchPointer(
      page,
      'rejecting-handle-0',
      'pointerdown',
      { pointerId: 7, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1, xy: origin }
    )
    // Absolute coordinates: the echo moves the Handle, the origin must not.
    await dispatchPointer(
      page,
      'rejecting-handle-0',
      'pointermove',
      { pointerId: 7, buttons: 1, xy: { x: origin.x + 20, y: origin.y } },
      'window'
    )
    await expect(page.getByTestId('rejecting-requests')).toHaveText('A:[45.013,54.987]')

    await page.getByTestId('rejecting-echo').click()
    await page.getByTestId('rejecting-swap-constraints').click()
    await page.getByTestId('rejecting-swap-handler').click()
    await expect(page.getByTestId('rejecting-handler')).toHaveText('B')

    // Solved from origin [40,60] + 50px under the NEW max: clamps to 50.
    await dispatchPointer(
      page,
      'rejecting-handle-0',
      'pointermove',
      { pointerId: 7, buttons: 1, xy: { x: origin.x + 50, y: origin.y } },
      'window'
    )
    await expect(page.getByTestId('rejecting-requests')).toHaveText(
      'A:[45.013,54.987] | B:[50,50]'
    )
    const vars = await page.evaluate(() => {
      const panels = [
        ...document.querySelectorAll(
          '[data-testid="test-splitter-rejecting"] [data-reference-splitter-panel]'
        ),
      ] as HTMLElement[]
      return panels.map((p) => p.style.getPropertyValue('--reference-splitter-panel-size'))
    })
    expect(vars).toEqual(['50%', '50%'])

    await dispatchPointer(
      page,
      'rejecting-handle-0',
      'pointerup',
      { pointerId: 7, buttons: 0, xy: { x: origin.x + 50, y: origin.y } },
      'window'
    )
    await expect(page.getByTestId('rejecting-ends')).toHaveText('B:[50,50]')
  })

  test('SP-COMP-03: Nested flex partitions isolate callbacks, ARIA, hooks, and outer commits', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Nested')
    await page.waitForTimeout(150)
    const outerBefore = await page.evaluate(
      () => (window as unknown as { __spCommits: Record<string, number> }).__spCommits['nested-outer-panel-0']
    )

    const inner = await handleCenter(page, 'nested-inner-handle-0')
    await page.mouse.move(inner.x, inner.y)
    await page.mouse.down()
    await page.mouse.move(inner.x, inner.y + 48, { steps: 4 })
    await page.mouse.up()
    await expect(page.getByTestId('nested-inner-display')).toHaveText('Inner: 70% / 30%')
    await expect(page.getByTestId('nested-outer-display')).toHaveText('Outer: 40% / 60%')
    await expect(page.getByTestId('nested-inner-ends')).toHaveText('1')
    await expect(page.getByTestId('nested-outer-ends')).toHaveText('0')

    // Inner moves never committed the outer tree's memoized descendants.
    await page.waitForTimeout(100)
    const outerAfter = await page.evaluate(
      () => (window as unknown as { __spCommits: Record<string, number> }).__spCommits['nested-outer-panel-0']
    )
    expect(outerAfter).toBe(outerBefore)

    const outer = await handleCenter(page, 'nested-outer-handle-0')
    await page.mouse.move(outer.x, outer.y)
    await page.mouse.down()
    await page.mouse.move(outer.x + 40, outer.y, { steps: 4 })
    await page.mouse.up()
    await expect(page.getByTestId('nested-outer-display')).toHaveText('Outer: 50% / 50%')
    await expect(page.getByTestId('nested-inner-display')).toHaveText('Inner: 70% / 30%')
    await expect(page.getByTestId('nested-outer-ends')).toHaveText('1')
    await expect(page.getByTestId('nested-inner-ends')).toHaveText('1')
    // No document gesture survives the sequence.
    const clean = await page.evaluate(() => ({
      resizing: document.querySelectorAll('[data-resizing]').length,
      cursor: document.body.style.cursor,
      userSelect: document.body.style.userSelect,
    }))
    expect(clean).toEqual({ resizing: 0, cursor: '', userSelect: '' })
  })

  test('SP-COMP-04: An inner CSS grid reflows with its Panel while Splitter writes no grid signal', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/InnerGrid')

    const measure = () =>
      page.evaluate(() => {
        const grid = document.querySelector('[data-testid="innergrid-grid"]') as HTMLElement
        const cell0 = document.querySelector('[data-testid="innergrid-cell-0"]') as HTMLElement
        const cell1 = document.querySelector('[data-testid="innergrid-cell-1"]') as HTMLElement
        const root = document.querySelector('[data-testid="test-splitter-innergrid"]') as HTMLElement
        const panel = document.querySelector('[data-testid="innergrid-panel-1"]') as HTMLElement
        return {
          gridWidth: grid.getBoundingClientRect().width,
          cell0: cell0.getBoundingClientRect().width,
          cell1: cell1.getBoundingClientRect().width,
          panelWidth: panel.clientWidth,
          rootStyle: root.getAttribute('style') ?? '',
          panelStyle: panel.getAttribute('style') ?? '',
        }
      })

    const before = await measure()
    expect(before.rootStyle).not.toContain('grid-template')
    expect(before.panelStyle).not.toContain('grid-template')

    const at = await handleCenter(page, 'innergrid-handle-0')
    await page.mouse.move(at.x, at.y)
    await page.mouse.down()
    await page.mouse.move(at.x - 80, at.y, { steps: 5 })
    await page.mouse.up()
    await expect(page.getByTestId('innergrid-value-display')).toHaveText('Layout: 20% / 80%')

    const after = await measure()
    // Both tracks scale with the Panel and keep their 1:2 ratio; the grid's
    // used width matches the Panel; Splitter wrote no grid signal.
    expect(after.cell0).toBeGreaterThan(before.cell0 + 10)
    expect(after.cell1).toBeGreaterThan(before.cell1 + 10)
    expect(after.cell1 / after.cell0).toBeCloseTo(2, 0)
    expect(Math.abs(after.gridWidth - after.panelWidth)).toBeLessThanOrEqual(1)
    expect(after.rootStyle).not.toContain('grid-template')
    expect(after.panelStyle).not.toContain('grid-template')
  })
})

test.describe('Splitter FINISH-LINE P2F tails', () => {
  test('SP-DOM-04: Separator orientation stays perpendicular while Root/part hooks follow the Panel axis', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/OrientationToggle')

    const hooks = () =>
      page.evaluate(() => {
        const root = document.querySelector('[data-testid="test-splitter-orientation"]') as HTMLElement
        const panels = [...root.querySelectorAll('[data-reference-splitter-panel]')] as HTMLElement[]
        const handle = document.querySelector('[data-testid="orientation-handle-0"]') as HTMLElement
        return {
          root: root.dataset.orientation,
          panels: panels.map((p) => p.dataset.orientation),
          handle: handle.dataset.orientation,
          aria: handle.getAttribute('aria-orientation'),
        }
      })

    expect(await hooks()).toEqual({
      root: 'horizontal',
      panels: ['horizontal', 'horizontal'],
      handle: 'horizontal',
      aria: 'vertical',
    })
    await expect(page.getByTestId('orientation-value-display')).toHaveText('Layout: 40% / 60%')

    await page.getByTestId('orientation-toggle').click()

    // Rerender vertical: styling hooks follow the Panel layout axis while
    // the separator movement axis flips perpendicular — values untouched.
    expect(await hooks()).toEqual({
      root: 'vertical',
      panels: ['vertical', 'vertical'],
      handle: 'vertical',
      aria: 'horizontal',
    })
    await expect(page.getByTestId('orientation-value-display')).toHaveText('Layout: 40% / 60%')
    await expect(page.getByTestId('orientation-change-count')).toHaveText('0')
  })

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

  test('SP-DOM-07: Native props, handlers, and refs reach every part and clean up the same nodes', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/NativeProps')

    // IDs, owners, ARIA, classes, and styles reach the native divs.
    const dom = await page.evaluate(() => {
      const read = (testId: string) => {
        const el = document.querySelector(`[data-testid="${testId}"]`) as HTMLElement
        return {
          tag: el.tagName,
          id: el.id,
          owner: el.dataset.owner,
          label: el.getAttribute('aria-label'),
          className: el.className,
          border: el.style.border,
        }
      }
      return {
        root: read('test-splitter-native'),
        panel0: read('native-panel-0'),
        handle0: read('native-handle-0'),
        panel1: read('native-panel-1'),
      }
    })
    expect(dom.root).toMatchObject({
      tag: 'DIV',
      id: 'native-splitter-root',
      owner: 'root',
      label: 'Native splitter group',
      border: '1px solid rgb(1, 2, 3)',
    })
    expect(dom.root.className).toContain('app-native-root')
    expect(dom.panel0).toMatchObject({ tag: 'DIV', id: 'native-panel-0', owner: 'panel0' })
    expect(dom.panel0.className).toContain('app-native-panel')
    expect(dom.handle0).toMatchObject({
      tag: 'DIV',
      id: 'native-handle-0',
      owner: 'handle0',
      label: 'Resize native panels',
    })
    expect(dom.handle0.className).toContain('app-native-handle')
    expect(dom.panel1).toMatchObject({ tag: 'DIV', id: 'native-panel-1', owner: 'panel1' })

    // Object refs (Root, Panel1) and callback refs (Panel0, Handle) got nodes.
    const objectRefs = await page.evaluate(() => {
      const refs = (window as unknown as { __spNativeRefs: Record<string, { current: HTMLElement | null }> })
        .__spNativeRefs
      const read = (key: string) => {
        const current = refs[key]?.current
        return current ? { tag: current.tagName, testId: current.dataset.testid } : null
      }
      return { root: read('root'), panel1: read('panel1') }
    })
    expect(objectRefs).toEqual({
      root: { tag: 'DIV', testId: 'test-splitter-native' },
      panel1: { tag: 'DIV', testId: 'native-panel-1' },
    })
    // Mount settles with both nodes attached. Registration settle may cost
    // one extra detach/attach round; the contract is relative to that
    // baseline: every round delivers the same live node, interactions add
    // nothing, unmount detaches, remount re-attaches fresh nodes — no
    // ref-triggered render loop.
    const refLog = () =>
      page.evaluate(() => (window as unknown as { __spRefLog?: string[] }).__spRefLog ?? [])
    const mountedLog = await refLog()
    const tags = (label: string) =>
      mountedLog.filter((e) => e.startsWith(`${label}:attach:`)).map((e) => e.split('#')[1])
    for (const label of ['panel0', 'handle0']) {
      expect(tags(label).length).toBeGreaterThanOrEqual(1)
      expect(tags(label).length).toBeLessThanOrEqual(2)
      expect(new Set(tags(label)).size).toBe(1)
    }
    const liveNodes = await page.evaluate(() => {
      const attached = (window as unknown as { __spAttached: Record<string, Element> }).__spAttached
      return {
        panel0: attached.panel0 === document.querySelector('[data-testid="native-panel-0"]'),
        handle0: attached.handle0 === document.querySelector('[data-testid="native-handle-0"]'),
      }
    })
    expect(liveNodes).toEqual({ panel0: true, handle0: true })

    // Handlers observe their own node as currentTarget (plus the Root bubble).
    await page.getByTestId('native-panel-0').click()
    await page.getByTestId('native-handle-0').click()
    await page.getByTestId('native-panel-1').click()
    const clicks = await page.getByTestId('native-clicks').textContent()
    expect(clicks).toContain('panel0:DIV:panel0')
    expect(clicks).toContain('handle0:DIV:handle0')
    expect(clicks).toContain('panel1:DIV:panel1')
    expect(clicks).toContain('root:DIV:root')
    // A click is press-without-move: no resize requests, no ref churn.
    expect(await refLog()).toEqual(mountedLog)

    // Unmount: callback refs detach and the object refs null.
    await page.getByTestId('native-toggle-mounted').click()
    await expect(page.getByTestId('native-unmounted')).toBeVisible()
    expect(await refLog()).toEqual([...mountedLog, 'panel0:detach', 'handle0:detach'])
    const nulled = await page.evaluate(() => {
      const refs = (window as unknown as { __spNativeRefs: Record<string, { current: unknown }> })
        .__spNativeRefs
      return { root: refs.root?.current ?? null, panel1: refs.panel1?.current ?? null }
    })
    expect(nulled).toEqual({ root: null, panel1: null })

    // Remount: refs re-attach to fresh nodes with no render loop.
    await page.getByTestId('native-toggle-mounted').click()
    await expect(page.getByTestId('test-splitter-native')).toBeVisible()
    const remountedLog = await refLog()
    expect(remountedLog.slice(0, mountedLog.length + 2)).toEqual([
      ...mountedLog,
      'panel0:detach',
      'handle0:detach',
    ])
    // Remount settles with the same shape as mount, on fresh nodes.
    const shape = (entries: string[]) => entries.map((e) => e.replace(/#\d+$/, ''))
    const tail = remountedLog.slice(mountedLog.length + 2)
    expect(shape(tail)).toEqual(shape(mountedLog))
    const tailTags = (label: string) =>
      tail.filter((e) => e.startsWith(`${label}:attach:`)).map((e) => e.split('#')[1])
    for (const label of ['panel0', 'handle0']) {
      expect(new Set(tailTags(label)).size).toBe(1)
      expect(tailTags(label)[0]).not.toBe(tags(label)[0])
    }
    await expect(page.getByTestId('native-value-display')).toHaveText('Layout: 40% / 60%')
  })

  test('SP-DOM-10: Omitted orientation means horizontal Panels with a vertical separator', async ({
    mount,
    page,
  }) => {
    // The Basic fixture omits orientation entirely.
    await mount('components/Splitter/Splitter/Basic')

    await expect(page.getByTestId('test-splitter')).toHaveAttribute('data-orientation', 'horizontal')
    await expect(page.getByTestId('splitter-handle-0')).toHaveAttribute('aria-orientation', 'vertical')
    const direction = await page.evaluate(
      () =>
        getComputedStyle(document.querySelector('[data-testid="test-splitter"]') as HTMLElement)
          .flexDirection
    )
    expect(direction).toBe('row')

    await page.getByTestId('splitter-handle-0').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('splitter-value-display')).toHaveText('Layout: 41% / 59%')
    await expect(page.getByTestId('splitter-handle-0')).toHaveAttribute('aria-valuenow', '41')
  })

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

  test('SP-CTRL-03: Programmatic values update hooks and ARIA on the same nodes with focus kept', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Dynamic')
    const handle = page.getByTestId('dynamic-handle-0')
    await handle.focus()

    await page.evaluate(() => {
      const w = window as unknown as {
        __spNodes?: Record<string, Element | null>
        __spStray?: number
      }
      w.__spNodes = {
        root: document.querySelector('[data-testid="test-splitter-dynamic"]'),
        panelA: document.querySelector('[data-testid="dynamic-panel-a"]'),
        handle0: document.querySelector('[data-testid="dynamic-handle-0"]'),
      }
      w.__spStray = 0
      const count = () => {
        w.__spStray = (w.__spStray ?? 0) + 1
      }
      document
        .querySelector('[data-testid="test-splitter-dynamic"]')
        ?.addEventListener('pointerdown', count, true)
      document
        .querySelector('[data-testid="test-splitter-dynamic"]')
        ?.addEventListener('keydown', count, true)
    })

    // Programmatic rerender without stealing focus.
    await page.evaluate(() =>
      (document.querySelector('[data-testid="dynamic-op-programmatic"]') as HTMLElement).click()
    )
    await expect(page.getByTestId('dynamic-value-display')).toHaveText('Layout: 5% / 60% / 35%')

    const after = await page.evaluate(() => {
      const w = window as unknown as {
        __spNodes: Record<string, Element | null>
        __spStray: number
      }
      const panelA = document.querySelector('[data-testid="dynamic-panel-a"]') as HTMLElement
      const handle0 = document.querySelector('[data-testid="dynamic-handle-0"]') as HTMLElement
      const now = Number(handle0.getAttribute('aria-valuenow'))
      return {
        sameRoot:
          w.__spNodes.root === document.querySelector('[data-testid="test-splitter-dynamic"]'),
        samePanelA: w.__spNodes.panelA === panelA,
        sameHandle: w.__spNodes.handle0 === handle0,
        panelVar: panelA.style.getPropertyValue('--reference-splitter-panel-size'),
        collapsed: panelA.hasAttribute('data-collapsed'),
        now,
        min: Number(handle0.getAttribute('aria-valuemin')),
        max: Number(handle0.getAttribute('aria-valuemax')),
        focused: document.activeElement === handle0,
        stray: w.__spStray,
      }
    })
    expect(after.sameRoot).toBe(true)
    expect(after.samePanelA).toBe(true)
    expect(after.sameHandle).toBe(true)
    expect(after.panelVar).toBe('5%')
    expect(after.collapsed).toBe(true)
    expect(after.now).toBe(5)
    expect(after.min).toBeLessThanOrEqual(5)
    expect(after.max).toBeGreaterThanOrEqual(5)
    expect(after.focused).toBe(true)
    expect(after.stray).toBe(0)
    await expect(page.getByTestId('dynamic-change-count')).toHaveText('0')
    await expect(page.getByTestId('dynamic-change-end-count')).toHaveText('0')
  })

  test('SP-KEY-01: Unmodified axis Arrows request one point per keydown, horizontal and vertical', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Constrained')
    await page.getByTestId('constrained-handle-0').focus()

    // One callback per keydown in each direction.
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 41% / 59%')
    await expect(page.getByTestId('change-count')).toHaveText('1')
    await expect(page.getByTestId('change-end-count')).toHaveText('1')
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 40% / 60%')
    await expect(page.getByTestId('change-count')).toHaveText('2')
    await expect(page.getByTestId('change-end-count')).toHaveText('2')

    await mount('components/Splitter/Splitter/Vertical')
    await page.getByTestId('splitter-vertical-handle').focus()
    await page.keyboard.press('ArrowDown')
    await expect(page.getByText('Top (51%)')).toBeVisible()
    await page.keyboard.press('ArrowUp')
    await expect(page.getByText('Top (50%)')).toBeVisible()
    // CT runs Chromium; Firefox/WebKit parity for this key matrix is a
    // matrix remainder (see PATCHES #5 / SP-ENV-04).
  })

  test('SP-KEY-03: Shift+Arrow requests ten points through the same solver, clamped at bounds', async ({
    mount,
    page,
  }) => {
    // Fixture max is 60 (prose names 55): the clamp boundary adapts, the
    // solver path and focus behavior are what's pinned.
    await mount('components/Splitter/Splitter/Constrained')
    const handle = page.getByTestId('constrained-handle-0')
    await handle.focus()

    await page.keyboard.press('Shift+ArrowRight')
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 50% / 50%')
    await expect(page.getByTestId('change-count')).toHaveText('1')
    await expect(handle).toHaveAttribute('aria-valuenow', '50')

    await page.keyboard.press('Shift+ArrowRight')
    await expect(page.getByTestId('constrained-value-display')).toHaveText('Layout: 60% / 40%')
    await expect(page.getByTestId('change-count')).toHaveText('2')
    await expect(handle).toHaveAttribute('aria-valuenow', '60')
    await expect(handle).toHaveAttribute('aria-valuemax', '60')
    const focused = await page.evaluate(
      () => document.activeElement?.getAttribute('data-testid') === 'constrained-handle-0'
    )
    expect(focused).toBe(true)
  })

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
      userSelect: document.body.style.userSelect,
    }))
    expect(cleared.group).toBeNull()
    expect(cleared.resizing).toBe(0)
    expect(cleared.cursor).toBe('')
    expect(cleared.userSelect).toBe('')
    // Run this spec with --react all for the React 17/18/19 leg (StrictMode
    // replays effects on 18+ dev; 17 asserts uniform single behavior).
  })

  test('SP-ENV-03: A ShadowRoot Splitter keeps focus and drag cleanup inside its instance', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/ShadowHost')
    const handle = page.getByTestId('shadow-handle-0')
    await expect(handle).toBeVisible()

    // Focus lands in the shadow tree, not the light document.
    await handle.focus()
    const shadowFocus = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="shadow-host"]') as HTMLElement
      const shadow = host.shadowRoot!
      return {
        active: shadow.activeElement?.getAttribute('data-testid'),
        lightActive: document.activeElement?.getAttribute('data-testid'),
      }
    })
    expect(shadowFocus.active).toBe('shadow-handle-0')
    expect(shadowFocus.lightActive).toBe('shadow-host')

    // Drag from the shadow Handle to outside the host element.
    const at = await handleCenter(page, 'shadow-handle-0')
    const hostBox = await page.getByTestId('shadow-host').boundingBox()
    expect(hostBox).not.toBeNull()
    await page.mouse.move(at.x, at.y)
    await page.mouse.down()
    await page.mouse.move(hostBox!.x + hostBox!.width + 60, at.y + 40, { steps: 5 })
    await page.mouse.up()

    await expect(page.getByTestId('shadow-change-end-count')).toHaveText('1')
    const changes = await page.getByTestId('shadow-change-count').textContent()
    expect(Number(changes)).toBeGreaterThan(0)
    // Panel hooks inside the shadow tree followed the solver.
    const hook = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="shadow-host"]') as HTMLElement
      return (host.shadowRoot!.querySelector('[data-testid="shadow-panel-0"]') as HTMLElement).style
        .getPropertyValue('--reference-splitter-panel-size')
        .trim()
    })
    expect(hook).not.toBe('40%')
    expect(hook).toMatch(/^-?\d+(\.\d+)?%$/)

    // Cleanup belongs to the instance: shadow focus kept, document clean.
    const clean = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="shadow-host"]') as HTMLElement
      return {
        active: host.shadowRoot!.activeElement?.getAttribute('data-testid'),
        lightResizing: document.querySelectorAll('[data-resizing]').length,
        shadowResizing: host.shadowRoot!.querySelectorAll('[data-resizing]').length,
        cursor: document.body.style.cursor,
        userSelect: document.body.style.userSelect,
      }
    })
    expect(clean).toMatchObject({
      active: 'shadow-handle-0',
      lightResizing: 0,
      shadowResizing: 0,
      cursor: '',
      userSelect: '',
    })
  })

  test('SP-ENV-04: Two-Panel parity smoke — constrained drag, Arrows, and Enter collapse/restore', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Sidebar')
    const handle = page.getByTestId('sidebar-handle-0')
    await handle.focus()

    // Keyboard leg with exact arrays from fresh [30,70].
    await page.keyboard.press('ArrowRight')
    await expect(page.getByTestId('sidebar-last-request')).toHaveText('31,69')
    await page.keyboard.press('Shift+ArrowRight')
    await expect(page.getByTestId('sidebar-last-request')).toHaveText('41,59')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('sidebar-last-request')).toHaveText('5,95')
    await expect(page.getByTestId('sidebar-panel-0')).toHaveAttribute('data-collapsed', '')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('sidebar-last-request')).toHaveText('41,59')
    await expect(page.getByTestId('sidebar-panel-0')).not.toHaveAttribute('data-collapsed', '')
    await expect(page.getByTestId('sidebar-change-count')).toHaveText('4')
    await expect(page.getByTestId('sidebar-change-end-count')).toHaveText('4')
    await expect(handle).toHaveAttribute('aria-valuenow', '41')
    // Honest bounds include the collapse floor (Enter can reach 5).
    await expect(handle).toHaveAttribute('aria-valuemin', '5')
    await expect(handle).toHaveAttribute('aria-valuemax', '95')

    // Constrained drag leg: one end, focus kept, capture released.
    const at = await handleCenter(page, 'sidebar-handle-0')
    await page.mouse.move(at.x, at.y)
    await page.mouse.down()
    await page.mouse.move(at.x + 60, at.y, { steps: 5 })
    await page.mouse.up()
    await expect(page.getByTestId('sidebar-change-end-count')).toHaveText('5')
    const dragChanges = await page.getByTestId('sidebar-change-count').textContent()
    expect(Number(dragChanges)).toBeGreaterThan(4)

    const settled = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="test-splitter-sidebar"]') as HTMLElement
      const panel0 = document.querySelector('[data-testid="sidebar-panel-0"]') as HTMLElement
      const handleEl = document.querySelector('[data-testid="sidebar-handle-0"]') as HTMLElement
      return {
        focused: document.activeElement === handleEl,
        resizing: document.querySelectorAll('[data-resizing]').length,
        cursor: document.body.style.cursor,
        userSelect: document.body.style.userSelect,
        panelVar: panel0.style.getPropertyValue('--reference-splitter-panel-size'),
        root1: root.style.getPropertyValue('--reference-splitter-1'),
        now: handleEl.getAttribute('aria-valuenow'),
      }
    })
    expect(settled.focused).toBe(true)
    expect(settled.resizing).toBe(0)
    expect(settled.cursor).toBe('')
    expect(settled.userSelect).toBe('')
    // Size hooks agree with each other and the rounded display.
    expect(settled.panelVar).toBe(settled.root1)
    expect(Math.round(parseFloat(settled.panelVar))).toBe(Number(settled.now))
    // CT runs Chromium; Firefox/WebKit legs of this smoke are a matrix
    // remainder (see PATCHES #5).
  })

  test('FEATURES #11: Invisible hit area widens the pointer target while visuals stay 9px', async ({
    mount,
    page,
  }) => {
    await mount('components/Splitter/Splitter/Basic')

    const geometry = await page.evaluate(() => {
      const handle = document.querySelector('[data-testid="splitter-handle-0"]') as HTMLElement
      const line = handle.querySelector('[data-reference-splitter-handle-line]') as HTMLElement
      const rect = handle.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const hit = (x: number, y: number) =>
        (document.elementFromPoint(x, y) as HTMLElement | null)?.closest(
          '[data-testid="splitter-handle-0"]'
        ) != null
      const panel = (x: number, y: number) =>
        (document.elementFromPoint(x, y) as HTMLElement | null)?.closest(
          '[data-reference-splitter-panel]'
        ) != null
      return {
        handleWidth: getComputedStyle(handle).width,
        lineWidth: getComputedStyle(line).width,
        farOutsideLeftHitsPanel: panel(cx - 16, cy),
        stripLeftHitsHandle: hit(cx - 10, cy),
        stripRightHitsHandle: hit(cx + 10, cy),
        farOutsideRightHitsPanel: panel(cx + 16, cy),
      }
    })
    // Visuals unchanged: 9px Handle, 1px line.
    expect(geometry.handleWidth).toBe('9px')
    expect(geometry.lineWidth).toBe('1px')
    // The invisible strip (±12.5px) answers inside the 9px box's reach.
    expect(geometry.stripLeftHitsHandle).toBe(true)
    expect(geometry.stripRightHitsHandle).toBe(true)
    // Beyond the strip, neighboring content still wins.
    expect(geometry.farOutsideLeftHitsPanel).toBe(true)
    expect(geometry.farOutsideRightHitsPanel).toBe(true)

    await mount('components/Splitter/Splitter/Vertical')
    const vertical = await page.evaluate(() => {
      const handle = document.querySelector(
        '[data-testid="splitter-vertical-handle"]'
      ) as HTMLElement
      const rect = handle.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const hit = (x: number, y: number) =>
        (document.elementFromPoint(x, y) as HTMLElement | null)?.closest(
          '[data-testid="splitter-vertical-handle"]'
        ) != null
      return {
        handleHeight: getComputedStyle(handle).height,
        stripAboveHitsHandle: hit(cx, cy - 10),
        stripBelowHitsHandle: hit(cx, cy + 10),
      }
    })
    expect(vertical.handleHeight).toBe('9px')
    expect(vertical.stripAboveHitsHandle).toBe(true)
    expect(vertical.stripBelowHitsHandle).toBe(true)
  })
})
