/**
 * The transparent child's attach point: useComposedRef returns the stable
 * callback React calls with the authored container. Each attach fans the
 * node into the session container ref, the consumer's own ref, and the
 * forwarded ref, so the lock owns behavior while the author keeps the node.
 */
import * as React from 'react'
import { assignRef } from '../shared/refs'
import type { FocusLockSession } from './use-lock-session'

export function useComposedRef(session: FocusLockSession): (node: HTMLElement | null) => void {
  const composedRef = React.useCallback(
    (node: HTMLElement | null) => {
      session.containerRef.current = node
      assignRef(session.latestForwardedRef.current, node)
      assignRef(session.latestChildRef.current, node)
    },
    [session]
  )
  return composedRef
}
