// useMeasure: element rect plus a settled flag for geometry owners.
// It takes a ref callback target plus pause/settle options and emits the live rect and
// isSettled, observing with ResizeObserver and settling after a quiet window.
import * as React from 'react'
import { MEASUREMENT_SETTLE_TIMEOUT_MS } from './constants'
import { observeElementResize, resizeObserverFor } from './observe'
import { createMeasureSettled } from './settle'
import { readClientRect, rectsDiffer, type RectLike } from './rects'

export interface MeasureBox {
  width: number
  height: number
  top: number
  left: number
}

export interface UseMeasureOptions {
  /**
   * Stop observing. The last `rect` is kept.
   * @default false
   */
  paused?: boolean
  /**
   * Quiet time in milliseconds before `isSettled` turns `true`.
   * @default 20
   */
  settleTimeoutMs?: number
  /** Measure the element this ref holds instead of attaching `ref`. */
  target?: React.RefObject<HTMLElement | null>
}

export interface UseMeasureResult<E extends HTMLElement> {
  /** Attach to the element to measure. */
  ref: React.RefCallback<E>
  /** `{ width, height, top, left }` in pixels, or `null` before the first measurement. */
  rect: MeasureBox | null
  /** `true` once `rect` has not changed for `settleTimeoutMs`. */
  isSettled: boolean
}

function boxOf(rect: RectLike): MeasureBox {
  return { width: rect.width, height: rect.height, top: rect.top, left: rect.left }
}

type MeasureSession<E extends HTMLElement> = {
  element: E
  settleTimeoutMs: number
  observer: ResizeObserver
  settled: ReturnType<typeof createMeasureSettled>
}

/**
 * Settled border-box of an existing element. Not a wrapper component.
 *
 * Default path is ResizeObserver (border-box) + a quiet window. No rAF
 * loop. This is layout (size after CSS/content stop changing), not Overlay
 * living position.
 */
export function useMeasure<E extends HTMLElement = HTMLElement>(
  options?: UseMeasureOptions
): UseMeasureResult<E> {
  const paused = options?.paused === true
  const settleTimeoutMs = options?.settleTimeoutMs ?? MEASUREMENT_SETTLE_TIMEOUT_MS
  const target = options?.target
  const [node, setNode] = React.useState<E | null>(null)
  const [rect, setRect] = React.useState<MeasureBox | null>(null)
  const [isSettled, setIsSettled] = React.useState(false)
  const sessionRef = React.useRef<MeasureSession<E> | null>(null)
  const ref = React.useCallback((element: E | null) => {
    setNode(element)
  }, [])

  const stopSession = React.useCallback(() => {
    const session = sessionRef.current
    if (!session) return
    session.settled.dispose()
    session.observer.disconnect()
    sessionRef.current = null
  }, [])

  React.useLayoutEffect(() => {
    const element = paused ? null : (node ?? (target?.current as E | null) ?? null)

    if (paused) {
      setIsSettled(false)
    }

    const session = sessionRef.current
    if (session && element && session.element === element && session.settleTimeoutMs === settleTimeoutMs) {
      return
    }

    stopSession()
    const Observer = element ? resizeObserverFor(element) : undefined
    if (!element || typeof Observer !== 'function') return

    const settled = createMeasureSettled({
      timeoutMs: settleTimeoutMs,
      onSettled: () => setIsSettled(true),
    })

    const sample = () => {
      const next = readClientRect(element)
      settled.sample(next)
      setRect(previous => (previous && !rectsDiffer(previous, next) ? previous : boxOf(next)))
      setIsSettled(settled.settled)
    }

    const observer = new Observer(sample)
    observeElementResize(observer, element)
    sample()
    sessionRef.current = { element, settleTimeoutMs, observer, settled }
  })

  React.useLayoutEffect(() => {
    return () => {
      stopSession()
    }
  }, [stopSession])

  return { ref, rect, isSettled }
}
