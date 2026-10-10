/**
 * Toast outside-focus memory: the last element focused outside the host,
 * tracked so dismissing a focused toast can restore focus where the user
 * came from. The host's capture-phase focusin listener keeps it fresh;
 * items read it when their own recorded origin is gone or inside.
 */
import * as React from 'react'

let lastOutsideFocus: HTMLElement | null = null

export function getLastOutsideFocus(): HTMLElement | null {
  return lastOutsideFocus
}

export function setLastOutsideFocus(el: HTMLElement | null) {
  lastOutsideFocus = el
}

export function useOutsideFocusTracking() {
  React.useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const host = document.querySelector('[data-reference-toast-host]')
      const target = e.target
      if (target instanceof HTMLElement && host && !host.contains(target)) {
        setLastOutsideFocus(target)
      }
    }
    document.addEventListener('focusin', handleFocusIn, true)
    return () => document.removeEventListener('focusin', handleFocusIn, true)
  }, [])
}
