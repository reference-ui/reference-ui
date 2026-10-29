/**
 * Popover root: click or hover intent composed over Overlay. The component
 * runs the hover-intent hook, provides its value to the subtree, and wires
 * open state into a non-isolating Overlay — mounting the document-level
 * hover bridge only in `openOnHover` mode — plus the compound part
 * assignments and the public type surface. Timing, grace geometry, and
 * travel tracking live in sibling folders.
 */
import * as React from 'react'
import { Overlay } from '../Overlay'
import type { PopoverProps } from './types'
import { PopoverContext } from './context'
import { usePopoverIntent } from './hooks'
import { DEFAULT_CLOSE_DELAY, DEFAULT_OPEN_DELAY } from './hover/policy'
import { PopoverTrigger } from './parts/Trigger'
import { PopoverPortal } from './parts/Portal'
import { PopoverContent } from './parts/Content'
import { PopoverArrow } from './parts/Arrow'
import { PopoverClose } from './parts/Close'
import { PopoverHoverBridge } from './parts/HoverBridge'

export {
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  PopoverArrow,
  PopoverClose,
}
export type { PopoverProps } from './types'
export type { PopoverTriggerProps } from './parts/Trigger'
export type { PopoverContentProps } from './parts/Content'
export type { PopoverPortalProps } from './parts/Portal'
export type { PopoverArrowProps } from './parts/Arrow'
export type { PopoverCloseProps } from './parts/Close'

export function Popover({
  children,
  open: openProp,
  defaultOpen = false,
  onOpen,
  onOpenChange,
  onDismiss,
  openOnHover = false,
  openDelay = DEFAULT_OPEN_DELAY,
  closeDelay = DEFAULT_CLOSE_DELAY,
  ...overlayProps
}: PopoverProps) {
  const { isOpen, setIsOpen, value, session, startCloseTimer, clearHoverTimer } = usePopoverIntent({
    openProp,
    defaultOpen,
    onOpen,
    onOpenChange,
    onDismiss,
    openOnHover,
    openDelay,
    closeDelay,
  })

  return (
    <PopoverContext.Provider value={value}>
      <Overlay
        {...overlayProps}
        open={isOpen}
        onOpenChange={setIsOpen}
        isolation={false}
      >
        {openOnHover ? (
          <PopoverHoverBridge
            session={session}
            startCloseTimer={startCloseTimer}
            clearHoverTimer={clearHoverTimer}
          />
        ) : null}
        {children}
      </Overlay>
    </PopoverContext.Provider>
  )
}

Popover.Trigger = PopoverTrigger
Popover.Portal = PopoverPortal
Popover.Content = PopoverContent
Popover.Arrow = PopoverArrow
Popover.Close = PopoverClose
