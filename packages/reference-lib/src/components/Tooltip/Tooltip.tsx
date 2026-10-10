/**
 * Tooltip root: hover/focus intent composed over Overlay. The component
 * runs the intent hook, provides its value to the subtree, and wires open
 * state into a non-isolating, presence-free Overlay anchored to the
 * trigger — plus the compound part assignments and the public type
 * surface. Timing, grouping, and nesting live in sibling folders.
 */
import * as React from 'react'
import { Overlay } from '../Overlay'
import type { TooltipProps } from './types'
import { TooltipContext } from './context'
import { useTooltipIntent } from './hooks'
import { TooltipTrigger } from './parts/Trigger'
import { TooltipPortal } from './parts/Portal'
import { TooltipContent } from './parts/Content'
import { TooltipArrow } from './parts/Arrow'

export { TooltipTrigger, TooltipPortal, TooltipContent, TooltipArrow }
export type { TooltipProps } from './types'
export type { TooltipContentProps } from './parts/Content'
export type { TooltipArrowProps } from './parts/Arrow'

export function Tooltip({
  children,
  open: openProp,
  defaultOpen = false,
  onOpen,
  onOpenChange,
  onDismiss,
  onEscape,
  onOutsidePress,
  onInteractOutside,
  openDelay = 700,
  closeDelay = 300,
}: TooltipProps) {
  const { isOpen, setIsOpen, value } = useTooltipIntent({
    openProp,
    defaultOpen,
    onOpen,
    onOpenChange,
    onDismiss,
    openDelay,
    closeDelay,
  })

  return (
    <TooltipContext.Provider value={value}>
      <Overlay
        open={isOpen}
        onOpenChange={setIsOpen}
        isolation={false}
        closeOnScroll
        presence={false}
        anchor={value.triggerRef}
        onEscape={onEscape}
        onOutsidePress={onOutsidePress}
        onInteractOutside={onInteractOutside}
      >
        {children}
      </Overlay>
    </TooltipContext.Provider>
  )
}

export const TooltipComponent = {
  Root: Tooltip,
  Trigger: TooltipTrigger,
  Portal: TooltipPortal,
  Content: TooltipContent,
  Arrow: TooltipArrow,
}

Tooltip.Trigger = TooltipTrigger
Tooltip.Portal = TooltipPortal
Tooltip.Content = TooltipContent
Tooltip.Arrow = TooltipArrow
