import * as React from 'react'
import type { OverlayProps } from '../types'

/** Controlled / uncontrolled `open` with `onOpen` / `onDismiss` edges. */

export function useOverlayOpenState({
  open: openProp,
  defaultOpen = false,
  onOpen,
  onOpenChange,
  onDismiss,
}: Pick<OverlayProps, 'open' | 'defaultOpen' | 'onOpen' | 'onOpenChange' | 'onDismiss'>) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isControlled = openProp !== undefined
  const isOpen = isControlled ? openProp : internalOpen

  const setIsOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen && !isOpen) onOpen?.()
      if (!isControlled) setInternalOpen(nextOpen)
      onOpenChange?.(nextOpen)
      if (!nextOpen && isOpen) onDismiss?.()
    },
    [isControlled, isOpen, onOpen, onOpenChange, onDismiss]
  )

  return { isOpen, setIsOpen }
}
