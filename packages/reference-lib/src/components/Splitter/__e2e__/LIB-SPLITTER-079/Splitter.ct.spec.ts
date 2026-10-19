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
})
