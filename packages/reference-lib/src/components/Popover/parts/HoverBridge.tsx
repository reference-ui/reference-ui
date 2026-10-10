/**
 * Popover hover bridge: document-level pointer tracking for `openOnHover`.
 * Renders nothing; while open it samples pointer movement against the
 * safe polygon, holding the popover open through the grace corridor and
 * closing when the cursor abandons it, reverses away, loiters, or leaves
 * the window — unless focus sits inside the trigger or content. Borrows
 * the intent session and timer controls from the root so part-level
 * enter/leave and document-level travel share one state.
 */
import * as React from 'react'
import { isNodeInside, useOverlay } from '../../Overlay'
import type { Side } from '../../Overlay/geometry/floating'
import type { HoverSession } from '../hooks'
import { isHoverCapablePointer } from '../hover/policy'
import {
  asRect,
  CURSOR_SPEED_THRESHOLD,
  evaluatePointerSafety,
  INTENT_LINGER_MS,
  isReverseTravel,
  pointInRect,
  resolvedSide,
  SAFE_AREA_PADDING,
} from '../hover/safe-polygon'

export function PopoverHoverBridge({
  session,
  startCloseTimer,
  clearHoverTimer,
}: {
  session: React.MutableRefObject<HoverSession>
  startCloseTimer: () => void
  clearHoverTimer: () => void
}) {
  const overlay = useOverlay()
  const isOpen = overlay?.isOpen ?? false

  React.useEffect(() => {
    if (!overlay || !isOpen) return
    const doc =
      overlay.triggerRef.current?.ownerDocument ??
      overlay.contentRef.current?.ownerDocument ??
      document

    const focusInside = () => {
      const active = doc.activeElement
      return (
        isNodeInside(overlay.triggerRef.current, active) ||
        isNodeInside(overlay.contentRef.current, active)
      )
    }

    const closeIfAbandoned = () => {
      if (focusInside()) {
        clearHoverTimer()
        return
      }
      startCloseTimer()
    }

    const evaluate = (x: number, y: number) => {
      const trigger = overlay.triggerRef.current
      const content = overlay.contentRef.current
      if (!trigger || !content) {
        closeIfAbandoned()
        return
      }
      const triggerRect = asRect(trigger.getBoundingClientRect())
      const contentRect = asRect(content.getBoundingClientRect())
      const side: Side = resolvedSide(content)
      const state = session.current
      const safety = evaluatePointerSafety({
        x,
        y,
        leaveX: state.leaveX,
        leaveY: state.leaveY,
        side,
        trigger: triggerRect,
        content: contentRect,
        hasLanded: state.hasLanded,
      })

      if (safety === 'inside') {
        if (pointInRect(x, y, contentRect, SAFE_AREA_PADDING)) state.hasLanded = true
        clearHoverTimer()
        return
      }

      const now = performance.now()
      if (state.lastX !== null && state.lastY !== null) {
        const dx = x - state.lastX
        const dy = y - state.lastY
        const elapsed = now - state.lastT
        const moved = dx !== 0 || dy !== 0
        if (safety === 'grace' && !state.hasLanded && isReverseTravel(side, dx, dy)) {
          closeIfAbandoned()
          state.lastX = x
          state.lastY = y
          state.lastT = now
          return
        }
        if (safety === 'grace' && moved && elapsed > 0) {
          const speed = Math.hypot(dx, dy) / elapsed
          if (speed < CURSOR_SPEED_THRESHOLD) {
            closeIfAbandoned()
            state.lastX = x
            state.lastY = y
            state.lastT = now
            return
          }
        }
      }
      state.lastX = x
      state.lastY = y
      state.lastT = now

      if (safety === 'grace') {
        clearHoverTimer()
        if (!state.hasLanded) {
          state.linger = setTimeout(() => {
            closeIfAbandoned()
          }, INTENT_LINGER_MS)
        }
        return
      }

      closeIfAbandoned()
    }

    const onMove = (event: PointerEvent) => {
      if (!isHoverCapablePointer(event)) return
      evaluate(event.clientX, event.clientY)
    }

    const onLeaveWindow = (event: PointerEvent) => {
      if (event.relatedTarget == null) closeIfAbandoned()
    }

    doc.addEventListener('pointermove', onMove, true)
    doc.documentElement.addEventListener('pointerleave', onLeaveWindow)
    return () => {
      doc.removeEventListener('pointermove', onMove, true)
      doc.documentElement.removeEventListener('pointerleave', onLeaveWindow)
    }
  }, [overlay, isOpen, session, startCloseTimer, clearHoverTimer])

  return null
}
