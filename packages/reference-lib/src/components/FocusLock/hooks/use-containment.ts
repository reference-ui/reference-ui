/**
 * Live containment: useContainment owns the keydown/focus/mutation effect
 * that keeps an active lock closed. Tab wraps through the live candidate
 * list, focusin/focusout reclaim escapes to the inside fallback, and a
 * mutation observer repairs focus when the current node is removed or
 * invalidated — all gated on this lock being the document's top entry.
 */
import * as React from 'react'
import { getTabbableCandidates } from '../catalog/candidates'
import { isElementFocusable } from '../catalog/eligibility'
import { resolveTabTarget } from '../containment/tab-loop'
import { deepActiveElement, safeFocus } from '../shared/focus'
import { isInsideLock } from '../shared/inside'
import { isTopLock } from '../stack/stack'
import type { FocusLockSession } from './use-lock-session'

export function useContainment(
  session: FocusLockSession,
  options: {
    disabled: boolean
    rememberInside: (node: HTMLElement | null) => void
    pickInsideFallback: (container: HTMLElement, shards: HTMLElement[]) => HTMLElement
  }
): void {
  const { disabled, rememberInside, pickInsideFallback } = options
  const { clearReclaimFrame, lockId } = session

  React.useEffect(() => {
    if (disabled) return
    const container = session.containerRef.current
    if (!container) return
    const doc = container.ownerDocument

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !isTopLock(lockId, doc)) return
      if (event.defaultPrevented) return
      if (event.ctrlKey || event.altKey || event.metaKey) return

      if (session.initialFocusRef.current === false && !session.lastFocusedNodeRef.current) {
        return
      }

      const resolvedShards = session.getResolvedShardsRef.current()
      const tabbables = getTabbableCandidates(container, resolvedShards)

      if (tabbables.length === 0) {
        event.preventDefault()
        safeFocus(container)
        return
      }

      const active = deepActiveElement(doc)
      const inside = isInsideLock(container, resolvedShards, active)

      event.preventDefault()
      safeFocus(resolveTabTarget(tabbables, active, event.shiftKey, inside))
    }

    const reclaimToFallback = () => {
      if (!isTopLock(lockId, doc)) return
      if (session.movingFocusRef.current) return
      if (session.initialFocusRef.current === false && !session.lastFocusedNodeRef.current) return
      const resolvedShards = session.getResolvedShardsRef.current()
      const fallback = pickInsideFallback(container, resolvedShards)
      session.movingFocusRef.current = true
      safeFocus(fallback)
      session.movingFocusRef.current = false
      rememberInside(fallback)
    }

    const queueReclaim = () => {
      if (session.reclaimFrameRef.current != null) return
      session.reclaimFrameRef.current = requestAnimationFrame(() => {
        session.reclaimFrameRef.current = null
        if (!container.isConnected) return
        reclaimToFallback()
      })
    }

    const handleFocusIn = (event: FocusEvent) => {
      if (!isTopLock(lockId, doc)) return
      if (session.movingFocusRef.current) return
      const target = event.target
      if (!(target instanceof Node)) return

      const resolvedShards = session.getResolvedShardsRef.current()
      if (isInsideLock(container, resolvedShards, target)) {
        if (target instanceof HTMLElement) {
          rememberInside(target)
        }
        return
      }

      if (session.initialFocusRef.current === false && !session.lastFocusedNodeRef.current) {
        return
      }

      if (
        event.relatedTarget === null &&
        (target === doc.body || target === doc.documentElement)
      ) {
        return
      }

      reclaimToFallback()
    }

    // Safari blurs to body on outside mousedown without firing focusin,
    // so containment would be lost silently. Reclaim on the focusout
    // leg when focus leaves the lock for nowhere focusable. The
    // hasFocus gate skips window-blur (alt-tab keeps working).
    const handleFocusOut = (event: FocusEvent) => {
      if (!isTopLock(lockId, doc)) return
      if (session.movingFocusRef.current) return
      if (!doc.hasFocus()) return
      const target = event.target
      if (!(target instanceof Node)) return

      const resolvedShards = session.getResolvedShardsRef.current()
      if (!isInsideLock(container, resolvedShards, target)) return

      if (session.initialFocusRef.current === false && !session.lastFocusedNodeRef.current) {
        return
      }

      const related = event.relatedTarget
      if (related instanceof Node && isInsideLock(container, resolvedShards, related)) {
        return
      }

      reclaimToFallback()
    }

    const mutationObserver = new MutationObserver(() => {
      if (!isTopLock(lockId, doc)) return
      if (session.movingFocusRef.current) return
      const focusedElement = doc.activeElement as HTMLElement | null
      const resolvedShards = session.getResolvedShardsRef.current()
      if (
        focusedElement &&
        focusedElement !== doc.body &&
        isInsideLock(container, resolvedShards, focusedElement) &&
        isElementFocusable(focusedElement)
      ) {
        rememberInside(focusedElement)
        return
      }
      queueReclaim()
    })
    mutationObserver.observe(doc.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'disabled',
        'hidden',
        'inert',
        'open',
        'style',
        'class',
        'tabindex',
        'contenteditable',
      ],
    })

    doc.addEventListener('keydown', handleKeyDown)
    doc.addEventListener('focusin', handleFocusIn)
    doc.addEventListener('focusout', handleFocusOut)

    return () => {
      clearReclaimFrame()
      mutationObserver.disconnect()
      doc.removeEventListener('keydown', handleKeyDown)
      doc.removeEventListener('focusin', handleFocusIn)
      doc.removeEventListener('focusout', handleFocusOut)
    }
  }, [clearReclaimFrame, disabled, lockId, pickInsideFallback, rememberInside])
}
