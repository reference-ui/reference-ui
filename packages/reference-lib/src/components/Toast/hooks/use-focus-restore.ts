/**
 * Toast focus-restore hook: returns focus where it came from when a
 * focused toast exits. Records each focus entry's outside origin, then
 * on exit or unmount prefers that origin, falls back to the host-wide
 * outside memory, and finally hunts the nearest focusable neighbor by
 * DOM proximity. A double animation frame carries the exit restore past the
 * paint; the passive teardown restore queued behind a single frame is
 * canceled when the effect lifetime is re-established, so a mount replay
 * cannot undo a legitimate hotkey focus transfer. A genuine unmount has no
 * re-establishing setup and keeps its restore.
 */
import * as React from 'react'
import { isElementFocusable } from '../../FocusLock/catalog/eligibility'
import { findFocusableProximity } from '../../FocusLock/restore/proximity'
import { getLastOutsideFocus } from './use-outside-focus'

export function useFocusRestore({
  nodeRef,
  present,
}: {
  nodeRef: React.RefObject<HTMLDivElement | null>
  present: boolean
}) {
  const previousFocusRef = React.useRef<HTMLElement | null>(null)
  const restoreFrameRef = React.useRef<number | null>(null)

  const restoreToastFocus = React.useCallback(() => {
    if (typeof document === 'undefined') return
    const node = nodeRef.current
    const recorded = previousFocusRef.current
    const lastOutsideFocus = getLastOutsideFocus()
    const origin =
      recorded && (!node || !node.contains(recorded))
        ? recorded
        : lastOutsideFocus && (!node || !node.contains(lastOutsideFocus))
          ? lastOutsideFocus
          : recorded
    const parent = origin?.parentElement ?? null
    const next = origin?.nextElementSibling ?? null
    const prev = origin?.previousElementSibling ?? null
    if (origin && isElementFocusable(origin)) {
      origin.focus({ preventScroll: true })
      return
    }
    if (origin && next instanceof HTMLElement && isElementFocusable(next)) {
      next.focus({ preventScroll: true })
      return
    }
    findFocusableProximity(origin, parent, next, prev)?.focus({ preventScroll: true })
  }, [nodeRef])

  React.useLayoutEffect(() => {
    if (present) return
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => restoreToastFocus())
    })
    return () => cancelAnimationFrame(frame)
  }, [present, restoreToastFocus])

  React.useEffect(() => {
    if (restoreFrameRef.current !== null) {
      cancelAnimationFrame(restoreFrameRef.current)
      restoreFrameRef.current = null
    }
    return () => {
      const frame = requestAnimationFrame(() => {
        if (restoreFrameRef.current !== frame) return
        restoreFrameRef.current = null
        restoreToastFocus()
      })
      restoreFrameRef.current = frame
    }
  }, [restoreToastFocus])

  const recordFocusEntry = (currentTarget: HTMLDivElement, related: unknown) => {
    if (related instanceof HTMLElement && !currentTarget.contains(related)) {
      previousFocusRef.current = related
    } else {
      const lastOutsideFocus = getLastOutsideFocus()
      if (lastOutsideFocus && !currentTarget.contains(lastOutsideFocus)) {
        previousFocusRef.current = lastOutsideFocus
      }
    }
  }

  return { recordFocusEntry }
}
