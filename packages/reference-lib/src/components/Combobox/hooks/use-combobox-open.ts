/**
 * Combobox's open state: the deduped setIsOpen request (duplicate
 * requests inside one gesture collapse via the session's last-request
 * ref) with the onOpen/onOpenChange/onDismiss fan-out, plus the
 * closed-source arrow capture that pends first/last direction for the
 * open resolver (#8, CB-OPEN-02).
 */
import * as React from 'react'
import type { ComboboxSession } from './use-combobox-session'

export interface ComboboxOpen {
  setIsOpen: (open: boolean) => void
  requestArrowOpen: (direction: 1 | -1) => void
}

export function useComboboxOpen(
  session: ComboboxSession,
  callbacks: {
    onOpen?: () => void
    onOpenChange?: (open: boolean) => void
    onDismiss?: () => void
  }
): ComboboxOpen {
  const { isControlledOpen, isOpen, setInternalOpen, lastOpenRequestRef, pendingDirectionRef } = session
  const { onOpen, onOpenChange, onDismiss } = callbacks

  const setIsOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen === lastOpenRequestRef.current) return
      lastOpenRequestRef.current = nextOpen
      if (nextOpen && !isOpen) onOpen?.()
      if (!isControlledOpen) setInternalOpen(nextOpen)
      onOpenChange?.(nextOpen)
      if (!nextOpen && isOpen) onDismiss?.()
    },
    [isControlledOpen, isOpen, onOpen, onOpenChange, onDismiss]
  )

  const requestArrowOpen = React.useCallback(
    (direction: 1 | -1) => {
      pendingDirectionRef.current = direction
      setIsOpen(true)
    },
    [setIsOpen]
  )

  return { setIsOpen, requestArrowOpen }
}
