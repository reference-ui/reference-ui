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
   * Skip ResizeObserver and settle while true (pointer drag, CSS animation).
   * Last rect is kept; `isSettled` is false until observation resumes.
   */
  paused?: boolean
  /** Quiet window before `isSettled`. Default 20ms. */
  settleTimeoutMs?: number
  /**
   * Observe an already-owned ref. Re-read after every commit so a node that
   * appears on a later render still attaches. Callback `ref` is the
   * canonical attach if you can put it on the host.
   */
  target?: React.RefObject<HTMLElement | null>
}

export interface UseMeasureResult<E extends HTMLElement> {
  /** Attach to the element being measured. Adds no host node. */
  ref: React.RefCallback<E>
  rect: MeasureBox | null
  isSettled: boolean
}

function boxOf(rect: RectLike): MeasureBox {
  return { width: rect.width, height: rect.height, top: rect.top, left: rect.left }
}

type Session<E extends HTMLElement> = {
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
  const sessionRef = React.useRef<Session<E> | null>(null)
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
