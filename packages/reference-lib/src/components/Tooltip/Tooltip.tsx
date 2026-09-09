import * as React from 'react'
import { type PrimitiveProps } from '@reference-ui/react'
import {
  Overlay,
  overlayStackStore,
  useOverlay,
  type OverlayContentProps,
  type OverlayDismissHandlers,
} from '../Overlay'
import { type PortalProps } from '../Portal'
import { isHoverCapablePointer } from '../Popover/hover'
import { getTooltipGroupStore, isGroupWarmed } from './tooltipGroup'

export interface TooltipProps extends OverlayDismissHandlers {
  children?: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpen?: () => void
  onOpenChange?: (open: boolean) => void
  openDelay?: number
  closeDelay?: number
}

interface Session {
  timer: ReturnType<typeof setTimeout> | null
  fromPointer: boolean
  suppressHover: boolean
}

interface TooltipContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  contentId: string
  triggerRef: React.MutableRefObject<HTMLElement | null>
  contentRef: React.MutableRefObject<HTMLDivElement | null>
  cancelIntent: () => void
  onTriggerEnter: (event: React.PointerEvent<HTMLElement>) => void
  onTriggerLeave: (event: React.PointerEvent<HTMLElement>) => void
  onTriggerPointerDown: (event: React.PointerEvent<HTMLElement>) => void
  onTriggerFocus: (event: React.FocusEvent<HTMLElement>) => void
  onTriggerBlur: (event: React.FocusEvent<HTMLElement>) => void
  onContentEnter: (event: React.PointerEvent<HTMLDivElement>) => void
  onContentLeave: (event: React.PointerEvent<HTMLDivElement>) => void
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null)

function emptySession(): Session {
  return { timer: null, fromPointer: false, suppressHover: false }
}

function isNestedTooltipTrigger(event: React.SyntheticEvent<HTMLElement>) {
  const target = event.target
  if (!(target instanceof Element)) return false
  const nested = target.closest('[data-reference-tooltip-trigger]')
  return Boolean(nested && nested !== event.currentTarget)
}

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
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const parentContext = React.useContext(TooltipContext)
  const isControlled = openProp !== undefined
  const isOpen = isControlled ? openProp : internalOpen
  const session = React.useRef<Session>(emptySession())
  const contentId = React.useId().replace(/:/g, '')

  const store = React.useMemo(
    () => getTooltipGroupStore(typeof document !== 'undefined' ? document : undefined),
    []
  )

  const triggerRef = React.useRef<HTMLElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)

  const latest = React.useRef({
    isOpen,
    openDelay,
    closeDelay,
    onOpen,
    onOpenChange,
    onDismiss,
    isControlled,
    contentId,
  })
  latest.current = {
    isOpen,
    openDelay,
    closeDelay,
    onOpen,
    onOpenChange,
    onDismiss,
    isControlled,
    contentId,
  }

  const cancelTimers = React.useCallback(() => {
    if (session.current.timer) {
      clearTimeout(session.current.timer)
      session.current.timer = null
    }
  }, [])

  const setIsOpen = React.useCallback(
    (nextOpen: boolean) => {
      const current = latest.current
      cancelTimers()
      if (nextOpen && !current.isOpen) current.onOpen?.()
      if (!current.isControlled) setInternalOpen(nextOpen)
      current.onOpenChange?.(nextOpen)
      if (!nextOpen && current.isOpen) current.onDismiss?.()
    },
    [cancelTimers]
  )

  const setIsOpenRef = React.useRef(setIsOpen)
  setIsOpenRef.current = setIsOpen

  const requestOpen = React.useCallback(() => {
    const state = store.getState()
    const id = latest.current.contentId
    if (state.activeId && state.activeId !== id) {
      store.getState().setPending(id)
      return
    }
    setIsOpenRef.current(true)
  }, [store])

  const startOpenTimer = React.useCallback(() => {
    cancelTimers()
    parentContext?.cancelIntent()
    if (latest.current.isOpen) return
    if (session.current.suppressHover) return
    const state = store.getState()
    if (isGroupWarmed(state)) {
      requestOpen()
      return
    }
    session.current.timer = setTimeout(() => {
      session.current.timer = null
      requestOpen()
    }, latest.current.openDelay)
  }, [cancelTimers, parentContext, requestOpen, store])

  const startCloseTimer = React.useCallback(() => {
    cancelTimers()
    session.current.timer = setTimeout(() => {
      session.current.timer = null
      setIsOpenRef.current(false)
    }, latest.current.closeDelay)
  }, [cancelTimers])

  const onTriggerEnter = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (event.defaultPrevented || !isHoverCapablePointer(event)) return
      if (isNestedTooltipTrigger(event)) return
      if (parentContext) parentContext.onTriggerLeave(event)
      if (latest.current.isOpen) {
        cancelTimers()
        return
      }
      startOpenTimer()
    },
    [cancelTimers, parentContext, startOpenTimer]
  )

  const onTriggerLeave = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (event.defaultPrevented || !isHoverCapablePointer(event)) return
      session.current.suppressHover = false
      if (isNestedTooltipTrigger(event)) return
      const state = store.getState()
      if (state.pendingId === latest.current.contentId) {
        store.getState().setPending(null)
      }
      if (!latest.current.isOpen) {
        cancelTimers()
        return
      }
      startCloseTimer()
    },
    [cancelTimers, startCloseTimer, store]
  )

  const onTriggerPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (event.defaultPrevented) return
      session.current.fromPointer = true
      if (!latest.current.isOpen) return
      session.current.suppressHover = true
      cancelTimers()
      setIsOpen(false)
    },
    [cancelTimers, setIsOpen]
  )

  const onTriggerFocus = React.useCallback(
    (event: React.FocusEvent<HTMLElement>) => {
      if (event.defaultPrevented) return
      if (session.current.fromPointer || session.current.suppressHover) return
      cancelTimers()
      if (!latest.current.isOpen) setIsOpen(true)
    },
    [cancelTimers, setIsOpen]
  )

  const onTriggerBlur = React.useCallback(
    (event: React.FocusEvent<HTMLElement>) => {
      if (event.defaultPrevented) return
      cancelTimers()
      if (latest.current.isOpen) setIsOpen(false)
    },
    [cancelTimers, setIsOpen]
  )

  const onContentEnter = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.defaultPrevented || !isHoverCapablePointer(event)) return
      session.current.suppressHover = false
      cancelTimers()
      if (!latest.current.isOpen) setIsOpen(true)
    },
    [cancelTimers, setIsOpen]
  )

  const onContentLeave = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.defaultPrevented || !isHoverCapablePointer(event)) return
      if (!latest.current.isOpen) return
      startCloseTimer()
    },
    [cancelTimers, startCloseTimer]
  )

  React.useEffect(() => {
    if (isOpen) {
      store.getState().setActive(contentId)
      store.getState().setPending(null)
    } else if (store.getState().activeId === contentId) {
      store.getState().setActive(null)
      store.getState().warm()
    }
  }, [isOpen, store, contentId])

  React.useEffect(() => {
    const unsub = store.subscribe(state => {
      if (latest.current.isOpen && state.pendingId && state.pendingId !== latest.current.contentId) {
        cancelTimers()
        setIsOpenRef.current(false)
      } else if (
        !latest.current.isOpen &&
        state.pendingId === latest.current.contentId &&
        state.activeId === null
      ) {
        setIsOpenRef.current(true)
      }
    })
    return unsub
  }, [store, cancelTimers])

  React.useEffect(() => () => cancelTimers(), [cancelTimers])

  React.useEffect(() => {
    if (typeof document === 'undefined') return
    const up = () => {
      session.current.fromPointer = false
    }
    document.addEventListener('pointerup', up, true)
    return () => document.removeEventListener('pointerup', up, true)
  }, [])

  const contextValue = React.useMemo<TooltipContextValue>(
    () => ({
      isOpen,
      setIsOpen,
      contentId,
      triggerRef,
      contentRef,
      cancelIntent: cancelTimers,
      onTriggerEnter,
      onTriggerLeave,
      onTriggerPointerDown,
      onTriggerFocus,
      onTriggerBlur,
      onContentEnter,
      onContentLeave,
    }),
    [
      isOpen,
      setIsOpen,
      contentId,
      cancelTimers,
      onTriggerEnter,
      onTriggerLeave,
      onTriggerPointerDown,
      onTriggerFocus,
      onTriggerBlur,
      onContentEnter,
      onContentLeave,
    ]
  )

  return (
    <TooltipContext.Provider value={contextValue}>
      <Overlay
        open={isOpen}
        onOpenChange={setIsOpen}
        isolation={false}
        closeOnScroll
        presence={false}
        anchor={triggerRef}
        onEscape={onEscape}
        onOutsidePress={onOutsidePress}
        onInteractOutside={onInteractOutside}
      >
        {children}
      </Overlay>
    </TooltipContext.Provider>
  )
}

export function TooltipTrigger({ children }: { children: React.ReactElement }) {
  const context = React.useContext(TooltipContext)
  const overlay = useOverlay()

  if (!children || typeof children !== 'object' || !React.isValidElement(children)) {
    throw new Error('Reference UI: Tooltip.Trigger expects a single valid React element child.')
  }

  const child = children as React.ReactElement<any>
  const originalRef = (child.props as { ref?: React.Ref<HTMLElement> }).ref

  const composedRef = (node: HTMLElement | null) => {
    if (context) context.triggerRef.current = node
    if (overlay) {
      overlay.triggerRef.current = node
      overlayStackStore.getState().setLayerTrigger(overlay.id, node)
    }
    if (typeof originalRef === 'function') {
      originalRef(node)
    } else if (originalRef && typeof originalRef === 'object' && 'current' in originalRef) {
      ;(originalRef as React.MutableRefObject<HTMLElement | null>).current = node
    }
  }

  const existingDescribedBy = child.props['aria-describedby'] || ''
  const ariaDescribedBy = context?.isOpen
    ? [existingDescribedBy, context.contentId].filter(Boolean).join(' ')
    : existingDescribedBy || undefined

  return React.cloneElement(child, {
    ref: composedRef,
    'data-reference-tooltip-trigger': '',
    'aria-describedby': ariaDescribedBy,
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
      child.props.onPointerEnter?.(e)
      context?.onTriggerEnter(e)
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
      child.props.onPointerLeave?.(e)
      context?.onTriggerLeave(e)
    },
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      child.props.onPointerDown?.(e)
      context?.onTriggerPointerDown(e)
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      child.props.onFocus?.(e)
      context?.onTriggerFocus(e)
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      child.props.onBlur?.(e)
      const next = e.relatedTarget
      if (next instanceof Node && overlay?.contentRef.current?.contains(next)) return
      context?.onTriggerBlur(e)
    },
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
      onPointerEnter={(e: React.PointerEvent<HTMLDivElement>) => {
        props.onPointerEnter?.(e)
        context.onContentEnter(e)
      }}
      onPointerLeave={(e: React.PointerEvent<HTMLDivElement>) => {
        props.onPointerLeave?.(e)
        context.onContentLeave(e)
      }}
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
