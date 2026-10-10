/**
 * Focus evacuation: moves focus out of the panel before closing content
 * turns inert. Focus inside returns to a live trigger when one exists and
 * otherwise falls back to blur-then-body; force-mount-alone content stays
 * interactive when closed, so focus inside it is never evacuated
 * (CO-PRES-07).
 */
import * as React from 'react'
import type { CollapsibleContextValue } from '../context'

export interface FocusEvacuationOptions {
  nodeRef: React.RefObject<HTMLDivElement | null>
  isOpen: boolean
  context: CollapsibleContextValue | null
  forceMountAlone: boolean
}

export function useFocusEvacuation({
  nodeRef,
  isOpen,
  context,
  forceMountAlone,
}: FocusEvacuationOptions): void {
  // CO-PRES-07: Evacuate focus before closing Content becomes inert.
  // CO-MOUNT: forceMount-alone content stays interactive when closed, so
  // focus inside it is never evacuated.
  const prevOpenRef = React.useRef(isOpen)
  React.useLayoutEffect(() => {
    const wasOpen = prevOpenRef.current
    prevOpenRef.current = isOpen

    if (wasOpen && !isOpen && !forceMountAlone) {
      const node = nodeRef.current
      if (node && typeof document !== 'undefined') {
        const activeEl = document.activeElement
        if (activeEl && node.contains(activeEl)) {
          const trigger = context?.triggerRef.current
          if (trigger && trigger.isConnected && !trigger.disabled) {
            trigger.focus()
          } else {
            if (activeEl instanceof HTMLElement) {
              activeEl.blur()
            }
            if (document.body && typeof document.body.focus === 'function') {
              document.body.focus()
            }
          }
        }
      }
    }
  }, [isOpen, context, forceMountAlone])
}
