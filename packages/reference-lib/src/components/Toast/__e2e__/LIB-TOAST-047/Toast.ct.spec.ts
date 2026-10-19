/**
 * Toast composition gates and browser proofs. Pins defined, default, and
 * custom toasts with stacking and hover expansion; Gate 6 timers, swipe,
 * hotkeys, and overlay pausing; Gate 7 enter/stack/exit motion, card
 * anatomy, loaders, themes, offsets, and RTL; plus hardening for DOM
 * identity, announcements, focus return, limits, premount replay, Shadow
 * DOM, and StrictMode.
 */
import { test, expect, snap, isWebKit } from '../../../../../playwright/ct'
import { expectNoAxeViolations } from '../../../../../playwright/axe'
import type { Page } from '@playwright/test'

async function setDocumentHidden(page: Page, hidden: boolean) {
  await page.evaluate(isHidden => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => (isHidden ? 'hidden' : 'visible'),
    })
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => isHidden,
    })
    document.dispatchEvent(new Event('visibilitychange'))
  }, hidden)
}

async function swipeToast(page: Page, id: string) {
  const toast = page.locator(`[data-reference-toast-id="${id}"]`)
  await expect(toast).toHaveAttribute('data-state', 'open')
  await toast.hover()
  const box = await toast.boundingBox()
  expect(box).toBeTruthy()
  const x = box!.x + box!.width / 2
  const y = box!.y + box!.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 220, y, { steps: 12 })
  await page.mouse.up()
}

function parseScale(transform: string): number {
  if (!transform || transform === 'none') return 1
  const m3 = transform.match(/matrix3d\(([^)]+)\)/)
  if (m3) return Number(m3[1].split(',')[0])
  const m = transform.match(/matrix\(([^)]+)\)/)
  if (m) return Number(m[1].split(',')[0])
  return 1
}

async function dragToast(page: Page, id: string, dx: number, dy: number, steps = 40) {
  const toast = page.locator(`[data-reference-toast-id="${id}"]`)
  await expect(toast).toHaveAttribute('data-state', 'open')
  await toast.hover()
  const box = await toast.boundingBox()
  expect(box).toBeTruthy()
  const x = box!.x + box!.width / 2
  const y = box!.y + box!.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + dx, y + dy, { steps })
  await page.waitForTimeout(250)
  await page.mouse.up()
}

// TO-HOTKEY-01 controlled-frame seam: queued mount work must not undo the
// legitimate hotkey focus transfer, so this control parks requestAnimationFrame
// callbacks and releases them on demand to prove the transfer holds; the release
// reports how many parked frames it drained.
const HOTKEY_RELEASE_FRAMES = 'reference-toast-hotkey-release-frames'
const HOTKEY_CLEANUP_FRAMES = 'reference-toast-hotkey-cleanup-frames'

type FocusDiagnostic = {
  tagName: string | null
  testid: string | null
  toastid: string | null
  inHost: boolean
}

function readFocusDiagnostic(): FocusDiagnostic {
  const active = document.activeElement
  const host = document.querySelector('[data-reference-toast-host]')
  const activeIsElement = active instanceof HTMLElement
  return {
    tagName: activeIsElement ? active.tagName : null,
    testid: activeIsElement ? active.getAttribute('data-testid') : null,
    toastid: activeIsElement ? active.getAttribute('data-reference-toast-id') : null,
    inHost: activeIsElement && host instanceof Element ? host.contains(active) : false,
  }
}

async function installControlledFrames(page: Page): Promise<void> {
  await page.evaluate(
    ({ releaseEvent, cleanupEvent }) => {
      const originalRequestAnimationFrame = window.requestAnimationFrame
      const originalCancelAnimationFrame = window.cancelAnimationFrame

      let nextHandle = -1
      const queued = new Map<number, FrameRequestCallback>()
      let installed = true

      const restoreNative = () => {
        if (!installed) return
        installed = false
        window.requestAnimationFrame = originalRequestAnimationFrame
        window.cancelAnimationFrame = originalCancelAnimationFrame
        queued.clear()
      }

      window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
        const handle = nextHandle
        nextHandle -= 1
        queued.set(handle, callback)
        return handle
      }

      window.cancelAnimationFrame = (handle: number): void => {
        if (queued.delete(handle)) return
        originalCancelAnimationFrame.call(window, handle)
      }

      const release = (event: Event) => {
        const pending = Array.from(queued.values())
        restoreNative()
        if (event instanceof CustomEvent) {
          const detail: unknown = event.detail
          if (typeof detail === 'object' && detail !== null && 'queuedCallbacks' in detail) {
            detail.queuedCallbacks = pending.length
          }
        }
        for (const callback of pending) callback(performance.now())
      }

      const cleanup = () => {
        restoreNative()
        window.removeEventListener(releaseEvent, release)
        window.removeEventListener(cleanupEvent, cleanup)
      }

      window.addEventListener(releaseEvent, release, { once: true })
      window.addEventListener(cleanupEvent, cleanup)
    },
    { releaseEvent: HOTKEY_RELEASE_FRAMES, cleanupEvent: HOTKEY_CLEANUP_FRAMES }
  )
}

async function releaseControlledFrames(page: Page): Promise<number> {
  return page.evaluate(
    releaseEvent => {
      const detail = { queuedCallbacks: 0 }
      window.dispatchEvent(new CustomEvent(releaseEvent, { detail }))
      return detail.queuedCallbacks
    },
    HOTKEY_RELEASE_FRAMES
  )
}

async function cleanupControlledFrames(page: Page): Promise<void> {
  await page.evaluate(
    cleanupEvent => {
      window.dispatchEvent(new Event(cleanupEvent))
    },
    HOTKEY_CLEANUP_FRAMES
  )
}

test.describe('Toast hardening', () => {

  test('TO-OV-03 / TO-OV-04 / TO-OV-05: toast stays exposed, does not dismiss overlay, and is not itself modal', async ({
    mount,
    page,
  }) => {
    await mount('components/Toast/Toast/Harden')
    await expect(page.getByTestId('toast-fixture-root')).toBeVisible()

    await page.getByTestId('btn-interactive').click()
    const host = page.locator('[data-reference-toast-host]')
    await expect(host).toBeAttached()
    await expect(page.getByTestId('toast-form')).toBeVisible()
    await expect(host).not.toHaveAttribute('inert')

    await page.getByTestId('btn-open-overlay').click()
    await expect(page.getByTestId('harden-modal')).toBeVisible()
    await expect(host).not.toHaveAttribute('inert')
    await expect(page.locator('[data-reference-announcer="polite"]')).toBeVisible()
    await page.getByTestId('toast-input').click()
    await page.getByTestId('toast-input').fill('kept')
    await expect(page.getByTestId('harden-modal')).toBeVisible()

    await page.getByTestId('btn-close-overlay').click()
    await expect(page.getByTestId('harden-modal')).toHaveCount(0)
    await page.getByTestId('btn-dismiss-all').click()
    await page.getByTestId('btn-untimed').click()
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-reference-toast-id="untimed"]')).toBeVisible()
    await page.getByTestId('btn-away').click()
    // WebKit never focuses on click — deliver
    // the focus state directly. The contract (toast is not modal; an outside
    // control stays reachable while the toast is exposed) still runs.
    if (isWebKit(page)) await page.getByTestId('btn-away').focus()
    await expect(page.getByTestId('btn-away')).toBeFocused()
  })
})
