import * as React from 'react'
import { Overlay, type OverlayPlacement } from '../Overlay'
import { Portal, type PortalProps } from '../Portal'
import { tooltipWarmup } from '../ReferenceLibrary'

export interface TooltipProps {
  children?: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpen?: () => void
  onOpenChange?: (open: boolean) => void
  onDismiss?: () => void
  openDelay?: number
  closeDelay?: number
}

interface TooltipContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  openDelay: number
  closeDelay: number
  contentId: string
  triggerRef: React.MutableRefObject<HTMLElement | null>
  contentRef: React.MutableRefObject<HTMLDivElement | null>
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null)

let tooltipIdCounter = 0

export function Tooltip({
  children,
  open: openProp,
  defaultOpen = false,
  onOpen,
  onOpenChange,
  onDismiss,
  openDelay = 700,
  closeDelay = 300,
}: TooltipProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isControlled = openProp !== undefined
  const isOpen = isControlled ? openProp : internalOpen

  const triggerRef = React.useRef<HTMLElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  const contentIdRef = React.useRef<string | null>(null)
  if (!contentIdRef.current) {
    contentIdRef.current = `tooltip-${++tooltipIdCounter}`
  }

  const setIsOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen && !isOpen) {
        onOpen?.()
      }
      if (!isControlled) {
        setInternalOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
      if (nextOpen) {
        tooltipWarmup.warm(document)
      }
      if (!nextOpen && isOpen) {
        onDismiss?.()
      }
    },
    [isControlled, isOpen, onOpen, onOpenChange, onDismiss]
  )

  const contextValue = React.useMemo<TooltipContextValue>(() => {
    return {
      isOpen,
      setIsOpen,
      openDelay,
      closeDelay,
      contentId: contentIdRef.current!,
      triggerRef,
      contentRef,
    }
  }, [isOpen, setIsOpen, openDelay, closeDelay])

  return (
    <TooltipContext.Provider value={contextValue}>
      <Overlay
        open={isOpen}
        onOpenChange={setIsOpen}
        isolation={false}
        closeOnScroll={true}
        anchor={triggerRef}
      >
        {children}
      </Overlay>
    </TooltipContext.Provider>
  )
}

export function TooltipTrigger({
  children,
}: {
  children: React.ReactElement
}) {
  const context = React.useContext(TooltipContext)
  const hoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!children || typeof children !== 'object' || !React.isValidElement(children)) {
    throw new Error('Reference UI: Tooltip.Trigger expects a single valid React element child.')
  }

  const child = children as React.ReactElement<any>
  const originalRef = (child as any).ref
  const originalOnPointerEnter = child.props.onPointerEnter
  const originalOnPointerLeave = child.props.onPointerLeave
  const originalOnFocus = child.props.onFocus
  const originalOnBlur = child.props.onBlur

  const composedRef = (node: HTMLElement | null) => {
    if (context) {
      context.triggerRef.current = node
    }
    if (typeof originalRef === 'function') {
      originalRef(node)
    } else if (originalRef && typeof originalRef === 'object' && 'current' in originalRef) {
      ;(originalRef as React.MutableRefObject<HTMLElement | null>).current = node
    }
  }

  const handlePointerEnter = (e: React.PointerEvent<HTMLElement>) => {
    originalOnPointerEnter?.(e)
    if (!e.defaultPrevented && context) {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)

      const isWarmed = typeof document !== 'undefined' && tooltipWarmup.isWarmed(document)
      const effectiveDelay = isWarmed ? 0 : context.openDelay

      if (effectiveDelay === 0) {
        context.setIsOpen(true)
      } else {
        hoverTimerRef.current = setTimeout(() => {
          context.setIsOpen(true)
        }, effectiveDelay)
      }
    }
  }

  const handlePointerLeave = (e: React.PointerEvent<HTMLElement>) => {
    originalOnPointerLeave?.(e)
    if (!e.defaultPrevented && context) {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = setTimeout(() => {
        context.setIsOpen(false)
      }, context.closeDelay)
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    originalOnFocus?.(e)
    if (!e.defaultPrevented && context) {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
      context.setIsOpen(true)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    originalOnBlur?.(e)
    if (!e.defaultPrevented && context) {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
      context.setIsOpen(false)
    }
  }

  const existingDescribedBy = child.props['aria-describedby'] || ''
  const ariaDescribedBy = context?.isOpen
    ? [existingDescribedBy, context.contentId].filter(Boolean).join(' ')
    : existingDescribedBy || undefined

  return React.cloneElement(child, {
    ref: composedRef,
    'aria-describedby': ariaDescribedBy,
    onPointerEnter: handlePointerEnter,
    onPointerLeave: handlePointerLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
  })
}

export function TooltipPortal({ children, container }: PortalProps) {
  return <Portal container={container}>{children}</Portal>
}

export interface TooltipContentProps extends React.ComponentPropsWithoutRef<'div'> {
  placement?: OverlayPlacement
  offset?: number
}

export function TooltipContent({
  children,
  id,
  placement = 'top',
  offset = 8,
  ...props
}: TooltipContentProps) {
  const context = React.useContext(TooltipContext)
  if (!context) return null

  const contentId = id ?? context.contentId

  return (
    <Overlay.Content
      id={contentId}
      role="tooltip"
      placement={placement}
      offset={offset}
      {...props}
    >
      {children}
    </Overlay.Content>
  )
}

export function TooltipArrow(props: React.ComponentPropsWithoutRef<'div'>) {
  return <Overlay.Arrow {...props} data-reference-tooltip-arrow="" />
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
