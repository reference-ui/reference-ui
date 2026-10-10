/**
 * Lock activation: useActivation owns the mount/enable effect that captures
 * the restore origin, registers the lock on the nesting stack, and performs
 * the initial focus move. Its cleanup unregisters, removes fallback
 * focusability it added, and restores immediately when a parent lock remains
 * or defers when this was the last activation in the document.
 */
import * as React from 'react'
import { getTabbableCandidates } from '../catalog/candidates'
import { isElementFocusable } from '../catalog/eligibility'
import { captureRestoreOrigin } from '../restore/decision'
import { lastPointerOrigin, trackPointerOrigin } from '../restore/pointer-origin'
import { isInsideLock } from '../shared/inside'
import { resolveFocusTarget } from '../shared/targets'
import { locksForDocument, registerLock, unregisterLock } from '../stack/stack'
import type { FocusLockSession } from './use-lock-session'

export function useActivation(
  session: FocusLockSession,
  options: {
    disabled: boolean
    rememberInside: (node: HTMLElement | null) => void
    restoreOnce: (doc: Document, container: HTMLElement | null) => void
    scheduleRestore: (doc: Document, container: HTMLElement | null) => void
  }
): void {
  const { disabled, rememberInside, restoreOnce, scheduleRestore } = options
  const { clearReclaimFrame, lockId } = session

  React.useEffect(() => {
    if (disabled) {
      return
    }

    if (session.restoreTimerRef.current != null) {
      clearTimeout(session.restoreTimerRef.current)
      session.restoreTimerRef.current = null
    }

    const container = session.containerRef.current
    if (!container) return
    const doc = container.ownerDocument
    session.restoredRef.current = false

    if (!session.previousActiveElementRef.current) {
      const shards = session.getResolvedShardsRef.current()
      trackPointerOrigin(doc)
      session.previousActiveElementRef.current = captureRestoreOrigin({
        active: doc.activeElement as HTMLElement | null,
        body: doc.body,
        defaultTarget: resolveFocusTarget(session.defaultRestoreTargetRef.current),
        pointer: lastPointerOrigin(doc),
        isInside: node => isInsideLock(container, shards, node),
        isFocusable: isElementFocusable,
      })
    }

    registerLock({
      id: lockId,
      container,
      shards: () => session.getResolvedShardsRef.current(),
      lastFocusedNode: session.lastFocusedNodeRef,
    })

    const activationInitialFocus = session.initialFocusRef.current
    if (activationInitialFocus !== false) {
      const explicitTarget = resolveFocusTarget(activationInitialFocus)
      const shards = session.getResolvedShardsRef.current()
      const isTargetInContainer = (el: HTMLElement | null): el is HTMLElement => {
        if (!el || !isElementFocusable(el)) return false
        return isInsideLock(container, shards, el)
      }

      if (explicitTarget && isTargetInContainer(explicitTarget)) {
        if (doc.activeElement !== explicitTarget) {
          session.movingFocusRef.current = true
          explicitTarget.focus({ preventScroll: true })
          session.movingFocusRef.current = false
        }
        rememberInside(explicitTarget)
      } else {
        const currentActive = doc.activeElement as HTMLElement | null
        if (currentActive && isTargetInContainer(currentActive) && currentActive !== container) {
          rememberInside(currentActive)
        } else {
          const tabbables = getTabbableCandidates(container, shards)
          if (tabbables.length > 0 && tabbables[0]) {
            session.movingFocusRef.current = true
            tabbables[0].focus({ preventScroll: true })
            session.movingFocusRef.current = false
            rememberInside(tabbables[0])
          } else {
            if (!container.hasAttribute('tabindex')) {
              container.setAttribute('tabindex', '-1')
              session.addedTabIndexRef.current = true
            }
            session.movingFocusRef.current = true
            container.focus({ preventScroll: true })
            session.movingFocusRef.current = false
            rememberInside(container)
          }
        }
      }
    }

    return () => {
      clearReclaimFrame()
      const live = locksForDocument(doc)
      const wasTop = live[live.length - 1]?.id === lockId
      unregisterLock(lockId)
      if (session.addedTabIndexRef.current && container.hasAttribute('tabindex')) {
        container.removeAttribute('tabindex')
        session.addedTabIndexRef.current = false
      }
      const remaining = locksForDocument(doc)
      if (!wasTop && remaining.length > 0) {
        return
      }
      if (remaining.length > 0) {
        restoreOnce(doc, container)
      } else {
        scheduleRestore(doc, container)
      }
    }
  }, [clearReclaimFrame, disabled, lockId, rememberInside, scheduleRestore])
}
