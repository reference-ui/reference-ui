/**
 * Deactivation restore: useRestore runs the lock's single return move.
 * restoreOnce resolves the landing through the restore decision chain and
 * focuses it at most once per activation, while scheduleRestore defers that
 * move a macrotask so the last activation in a document settles before focus
 * leaves. Stale timers cancel on reactivation.
 */
import * as React from 'react'
import { isElementFocusable } from '../catalog/eligibility'
import { resolveRestoreTarget } from '../restore/decision'
import { findFocusableProximity } from '../restore/proximity'
import { safeFocus } from '../shared/focus'
import { isInsideLock } from '../shared/inside'
import { resolveFocusTarget } from '../shared/targets'
import type { FocusLockSession } from './use-lock-session'

export function useRestore(session: FocusLockSession): {
  restoreOnce: (doc: Document, container: HTMLElement | null) => void
  scheduleRestore: (doc: Document, container: HTMLElement | null) => void
} {
  const restoreOnce = React.useCallback(
    (doc: Document, container: HTMLElement | null) => {
      if (session.restoredRef.current) return
      const latestRestoreFocus = session.restoreFocusRef.current
      if (latestRestoreFocus === false) {
        session.restoredRef.current = true
        return
      }
      const shards = session.getResolvedShardsRef.current()
      const target = resolveRestoreTarget({
        active: doc.activeElement as HTMLElement | null,
        body: doc.body,
        container,
        explicit: resolveFocusTarget(latestRestoreFocus),
        captured: session.previousActiveElementRef.current,
        defaultTarget: resolveFocusTarget(session.defaultRestoreTargetRef.current),
        isInside: node => (container ? isInsideLock(container, shards, node) : false),
        isFocusable: isElementFocusable,
        findProximity: findFocusableProximity,
      })
      session.restoredRef.current = true
      if (target) safeFocus(target)
    },
    [session]
  )

  const scheduleRestore = React.useCallback(
    (doc: Document, container: HTMLElement | null) => {
      if (session.restoreTimerRef.current != null) {
        clearTimeout(session.restoreTimerRef.current)
      }
      session.restoreTimerRef.current = setTimeout(() => {
        session.restoreTimerRef.current = null
        restoreOnce(doc, container)
      }, 0)
    },
    [session, restoreOnce]
  )

  return { restoreOnce, scheduleRestore }
}
