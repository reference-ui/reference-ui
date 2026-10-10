/**
 * Inside-focus memory: useInsideMemory tracks the lock's last two live
 * inside nodes. rememberInside records each arrival (keeping its
 * predecessor), and pickInsideFallback resolves the current reclaim landing
 * through the containment fallback — most recent live node first.
 */
import * as React from 'react'
import { getTabbableCandidates } from '../catalog/candidates'
import { isElementFocusable } from '../catalog/eligibility'
import { pickFallbackTarget } from '../containment/fallback'
import { isInsideLock } from '../shared/inside'
import type { FocusLockSession } from './use-lock-session'

export function useInsideMemory(session: FocusLockSession): {
  rememberInside: (node: HTMLElement | null) => void
  pickInsideFallback: (container: HTMLElement, shards: HTMLElement[]) => HTMLElement
} {
  const rememberInside = React.useCallback(
    (node: HTMLElement | null) => {
      if (!node) return
      const previous = session.lastFocusedNodeRef.current
      if (previous && previous !== node && previous.isConnected) {
        session.previousValidNodeRef.current = previous
      }
      session.lastFocusedNodeRef.current = node
    },
    [session]
  )

  const pickInsideFallback = React.useCallback(
    (container: HTMLElement, shards: HTMLElement[]): HTMLElement => {
      return pickFallbackTarget({
        last: session.lastFocusedNodeRef.current,
        previous: session.previousValidNodeRef.current,
        container,
        listFirst: () => getTabbableCandidates(container, shards)[0] || container,
        isUsable: node =>
          node.isConnected && isElementFocusable(node) && isInsideLock(container, shards, node),
      })
    },
    [session]
  )

  return { rememberInside, pickInsideFallback }
}
