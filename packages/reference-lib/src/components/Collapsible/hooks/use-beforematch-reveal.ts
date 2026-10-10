/**
 * Browser-find reveal: opens hidden-until-found content on `beforematch` so
 * the match is visible immediately, arming the one-shot motion skip. The
 * decision defers past dispatch so a consumer canceler registered after
 * mount still wins, and a cancelled or detached reveal stays closed.
 */
import * as React from 'react'
import type { CollapsibleContextValue } from '../context'
import { shouldRevealOnBeforeMatch } from '../mount/policy'

export interface BeforeMatchRevealOptions {
  nodeRef: React.RefObject<HTMLDivElement | null>
  untilFound: boolean
  isOpen: boolean
  context: CollapsibleContextValue | null
  skipMotionOnceRef: React.MutableRefObject<boolean>
}

export function useBeforeMatchReveal({
  nodeRef,
  untilFound,
  isOpen,
  context,
  skipMotionOnceRef,
}: BeforeMatchRevealOptions): void {
  // CO-MOUNT: browser find (`beforematch`) on closed hidden-until-found
  // content opens the Collapsible and skips enter motion so the match is
  // visible immediately. A consumer-cancelled reveal stays closed.
  React.useEffect(() => {
    if (!untilFound) return
    const node = nodeRef.current
    if (!node) return
    const handleBeforeMatch = (event: Event) => {
      // Defer past dispatch: every sync listener (including a consumer
      // canceler registered after mount) runs before the open decision.
      queueMicrotask(() => {
        if (
          !shouldRevealOnBeforeMatch({
            defaultPrevented: event.defaultPrevented,
            isConnected: node.isConnected,
            isOpen,
          })
        ) {
          return
        }
        skipMotionOnceRef.current = true
        context?.setIsOpen(true)
      })
    }
    node.addEventListener('beforematch', handleBeforeMatch)
    return () => {
      node.removeEventListener('beforematch', handleBeforeMatch)
    }
  }, [untilFound, isOpen, context, skipMotionOnceRef])
}
