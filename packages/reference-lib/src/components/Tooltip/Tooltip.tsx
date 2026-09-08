import * as React from 'react'
import { type PrimitiveProps } from '@reference-ui/react'
import { Overlay, type OverlayContentProps } from '../Overlay'
import { type PortalProps } from '../Portal'
import { getTooltipGroupStore } from './tooltipGroup'

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
  startOpenTimer: () => void
  startCloseTimer: () => void
  cancelTimers: () => void
  parentContext: TooltipContextValue | null
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
  const parentContext = React.useContext(TooltipContext)
  const isControlled = openProp !== undefined
  const isOpen = isControlled ? openProp : internalOpen

  const store = React.useMemo(() => getTooltipGroupStore(typeof document !== 'undefined' ? document : undefined), [])

  const triggerRef = React.useRef<HTMLElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)

const contentIdRef = React.useRef<string | null>(null)
  if (!contentIdRef.current) {
    contentIdRef.current = `tooltip-${++tooltipIdCounter}`
  }

  const hoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelTimers = React.useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }, [])

  const setIsOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen && !isOpen) {
        onOpen?.()
      }
      if (!isControlled) {
        setInternalOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)

      if (!nextOpen && isOpen) {
        onDismiss?.()
      }
    },
    [isControlled, isOpen, onOpen, onOpenChange, onDismiss]
  )

const startOpenTimer = React.useCallback(() => {
    cancelTimers()
    if (parentContext) parentContext.cancelTimers()
    if (!isOpen) {
      const state = store.getState()
      const isWarmed = Date.now() < state.warmUntil

      if (isWarmed) {
        if (state.activeId && state.activeId !== contentIdRef.current) {
           store.getState().setPending(contentIdRef.current)
        } else {
           setIsOpen(true)
        }
      } else {
        hoverTimerRef.current = setTimeout(() => {
          setIsOpen(true)
        }, openDelay)
      }
    }
  }, [cancelTimers, isOpen, openDelay, setIsOpen, store, parentContext])

  const startCloseTimer = React.useCallback(() => {
    cancelTimers()
    hoverTimerRef.current = setTimeout(() => {
      setIsOpen(false)
    }, closeDelay)
  }, [cancelTimers, closeDelay, setIsOpen])

React.useEffect(() => {
    if (isOpen) {
      store.getState().setActive(contentIdRef.current!)
      store.getState().setPending(null)
      store.getState().warm()
    } else {
      if (store.getState().activeId === contentIdRef.current) {
        store.getState().setActive(null)
      }
    }
  }, [isOpen, store])

  React.useEffect(() => {
    const unsub = store.subscribe((state) => {
      if (isOpen && state.pendingId && state.pendingId !== contentIdRef.current) {
        cancelTimers()
        setIsOpen(false)
      } else if (!isOpen && state.pendingId === contentIdRef.current && state.activeId === null) {
        setIsOpen(true)
      }
    })
    return unsub
  }, [isOpen, store, cancelTimers, setIsOpen])

  const contextValue = React.useMemo<TooltipContextValue>(() => {
    return {
      isOpen,
      setIsOpen,
      openDelay,
      closeDelay,
      contentId: contentIdRef.current!,
      triggerRef,
      contentRef,
      startOpenTimer,
      startCloseTimer,
      cancelTimers,
      parentContext,
    }
  }, [isOpen, setIsOpen, openDelay, closeDelay, startOpenTimer, startCloseTimer, cancelTimers, parentContext])

  return (
    <TooltipContext.Provider value={contextValue}>
      <Overlay
        open={isOpen}
        onOpenChange={setIsOpen}
        isolation={false}
        closeOnScroll={true}
        presence={false}
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
  const parentContext = React.useContext(TooltipContext)
  const context = React.useContext(TooltipContext)

  if (!children || typeof children !== 'object' || !React.isValidElement(children)) {
    throw new Error('Reference UI: Tooltip.Trigger expects a single valid React element child.')
  }

  const child = children as React.ReactElement<any>
  const originalRef = (child.props as any)?.ref
  const originalOnPointerEnter = child.props.onPointerEnter
  const originalOnPointerLeave = child.props.onPointerLeave
  const originalOnFocus = child.props.onFocus
  const originalOnBlur = child.props.onBlur
  const originalOnPointerDown = child.props.onPointerDown

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

const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    originalOnPointerDown?.(e)
    if (!e.defaultPrevented && context && context.isOpen) {
      context.cancelTimers()
      context.setIsOpen(false)
    }
  }

  const handlePointerEnter = (e: React.PointerEvent<HTMLElement>) => {
    originalOnPointerEnter?.(e)
    if (!e.defaultPrevented && context) {
      context.startOpenTimer()
    }
  }

const handlePointerLeave = (e: React.PointerEvent<HTMLElement>) => {
    originalOnPointerLeave?.(e)
    if (!e.defaultPrevented && context) {
      const store = getTooltipGroupStore(typeof document !== 'undefined' ? document : undefined)
      if (store.getState().pendingId === context.contentId) {
         store.getState().setPending(null)
      }
      context.startCloseTimer()
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    originalOnFocus?.(e)
    if (!e.defaultPrevented && context) {
      context.cancelTimers()
      context.setIsOpen(true)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    originalOnBlur?.(e)
    if (!e.defaultPrevented && context) {
      context.cancelTimers()
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
    onPointerDown: handlePointerDown,
    onFocus: handleFocus,
    onBlur: handleBlur,
  })
}

export function TooltipPortal({ children, container }: PortalProps) {
  return <Overlay.Portal container={container}>{children}</Overlay.Portal>
}

export type TooltipContentProps = OverlayContentProps

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

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    props.onPointerEnter?.(e)
    if (!e.defaultPrevented) {
      context.cancelTimers()
      context.setIsOpen(true)
    }
  }

  const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    props.onPointerLeave?.(e)
    if (!e.defaultPrevented) {
      context.startCloseTimer()
    }
  }

  return (
    <Overlay.Content
      id={contentId}
      role="tooltip"
      placement={placement}
      offset={offset}
      bg="design.primary.background"
      color="design.primary.foreground"
      fontSize="3r"
      lineHeight="4r"
      py="1r"
      px="2.5r"
      borderRadius="sm"
      boxShadow="0 2px 8px rgba(0,0,0,0.2)"
      {...props}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </Overlay.Content>
  )
}

export type TooltipArrowProps = PrimitiveProps<'div'>

export function TooltipArrow(props: TooltipArrowProps) {
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
