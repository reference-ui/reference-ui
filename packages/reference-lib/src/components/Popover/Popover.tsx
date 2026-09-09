import * as React from 'react'
import { Button, type PrimitiveProps } from '@reference-ui/react'
import {
  Overlay,
  useOverlay,
  isNodeInside,
  type OverlayProps,
  type OverlayContentProps,
  type OverlayTriggerProps,
} from '../Overlay'
import { type PortalProps } from '../Portal'
import {
  DEFAULT_CLOSE_DELAY,
  DEFAULT_OPEN_DELAY,
  IMPATIENT_CLICK_MS,
  isHoverCapablePointer,
} from './hover'
import {
  asRect,
  CURSOR_SPEED_THRESHOLD,
  evaluatePointerSafety,
  INTENT_LINGER_MS,
  isReverseTravel,
  pointInRect,
  resolvedSide,
  SAFE_AREA_PADDING,
  type Side,
} from './safe-polygon'

export interface PopoverProps extends Omit<OverlayProps, 'isolation' | 'edge'> {
  openOnHover?: boolean
  openDelay?: number
  closeDelay?: number
}

interface HoverSession {
  timer: ReturnType<typeof setTimeout> | null
  kind: 'open' | 'close' | null
  linger: ReturnType<typeof setTimeout> | null
  leaveX: number
  leaveY: number
  lastX: number | null
  lastY: number | null
  lastT: number
  hasLanded: boolean
  hoverOpenedAt: number
  fromPointer: boolean
}

interface PopoverContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  openOnHover: boolean
  contentId: string
  onTriggerEnter: (event: React.PointerEvent<HTMLButtonElement>) => void
  onTriggerLeave: (event: React.PointerEvent<HTMLButtonElement>) => void
  onTriggerPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void
  onTriggerClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  onTriggerFocus: (event: React.FocusEvent<HTMLButtonElement>) => void
  onFocusInside: () => void
  onFocusLeave: (
    next: EventTarget | null,
    trigger: HTMLElement | null,
    content: HTMLElement | null
  ) => void
  onContentEnter: (event: React.PointerEvent<HTMLDivElement>) => void
  onContentLeave: (event: React.PointerEvent<HTMLDivElement>) => void
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null)

let popoverIdCounter = 0

function emptySession(): HoverSession {
  return {
    timer: null,
    kind: null,
    linger: null,
    leaveX: 0,
    leaveY: 0,
    lastX: null,
    lastY: null,
    lastT: 0,
    hasLanded: false,
    hoverOpenedAt: 0,
    fromPointer: false,
  }
}

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
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const session = React.useRef<HoverSession>(emptySession())

  const isControlled = openProp !== undefined
  const isOpen = isControlled ? openProp : internalOpen

  const contentIdRef = React.useRef<string | null>(null)
  if (!contentIdRef.current) {
    contentIdRef.current = `popover-content-${++popoverIdCounter}`
  }

  const latest = React.useRef({
    isOpen,
    openOnHover,
    openDelay,
    closeDelay,
    onOpen,
    onOpenChange,
    onDismiss,
    isControlled,
  })
  latest.current = {
    isOpen,
    openOnHover,
    openDelay,
    closeDelay,
    onOpen,
    onOpenChange,
    onDismiss,
    isControlled,
  }

  const clearLinger = React.useCallback(() => {
    if (session.current.linger) {
      clearTimeout(session.current.linger)
      session.current.linger = null
    }
  }, [])

  const clearHoverTimer = React.useCallback(() => {
    if (session.current.timer) {
      clearTimeout(session.current.timer)
      session.current.timer = null
    }
    session.current.kind = null
    clearLinger()
  }, [clearLinger])

  const setIsOpen = React.useCallback(
    (nextOpen: boolean) => {
      const current = latest.current
      clearHoverTimer()
      if (nextOpen && !current.isOpen) current.onOpen?.()
      if (!current.isControlled) setInternalOpen(nextOpen)
      current.onOpenChange?.(nextOpen)
      if (!nextOpen && current.isOpen) {
        current.onDismiss?.()
        session.current.hoverOpenedAt = 0
        session.current.hasLanded = false
        session.current.lastX = null
        session.current.lastY = null
      }
    },
    [clearHoverTimer]
  )

  const setIsOpenRef = React.useRef(setIsOpen)
  setIsOpenRef.current = setIsOpen

  const startCloseTimer = React.useCallback(() => {
    const current = latest.current
    if (!current.openOnHover || !current.isOpen) return
    if (session.current.kind === 'close') return
    clearHoverTimer()
    session.current.kind = 'close'
    session.current.timer = setTimeout(() => {
      session.current.timer = null
      session.current.kind = null
      setIsOpenRef.current(false)
    }, current.closeDelay)
  }, [clearHoverTimer])

  const startOpenTimer = React.useCallback(() => {
    const current = latest.current
    if (!current.openOnHover || current.isOpen) return
    clearHoverTimer()
    session.current.kind = 'open'
    session.current.timer = setTimeout(() => {
      session.current.timer = null
      session.current.kind = null
      session.current.hoverOpenedAt = performance.now()
      setIsOpenRef.current(true)
    }, current.openDelay)
  }, [clearHoverTimer])

  const openNow = React.useCallback(() => {
    const current = latest.current
    if (!current.openOnHover || current.isOpen) return
    clearHoverTimer()
    session.current.hoverOpenedAt = performance.now()
    setIsOpenRef.current(true)
  }, [clearHoverTimer])

  const onTriggerEnter = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!latest.current.openOnHover || event.defaultPrevented) return
      if (!isHoverCapablePointer(event)) return
      session.current.hasLanded = false
      session.current.lastX = event.clientX
      session.current.lastY = event.clientY
      session.current.lastT = performance.now()
      if (latest.current.isOpen) {
        clearHoverTimer()
        return
      }
      startOpenTimer()
    },
    [clearHoverTimer, startOpenTimer]
  )

  const onTriggerLeave = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!latest.current.openOnHover || event.defaultPrevented) return
      if (!isHoverCapablePointer(event)) return
      session.current.leaveX = event.clientX
      session.current.leaveY = event.clientY
      session.current.lastX = event.clientX
      session.current.lastY = event.clientY
      session.current.lastT = performance.now()
      if (!latest.current.isOpen) {
        clearHoverTimer()
      }
    },
    [clearHoverTimer]
  )

  const onContentEnter = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!latest.current.openOnHover || event.defaultPrevented) return
      if (!isHoverCapablePointer(event)) return
      session.current.hasLanded = true
      session.current.lastX = event.clientX
      session.current.lastY = event.clientY
      session.current.lastT = performance.now()
      clearHoverTimer()
    },
    [clearHoverTimer]
  )

  const onContentLeave = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!latest.current.openOnHover || event.defaultPrevented) return
      if (!isHoverCapablePointer(event)) return
      session.current.leaveX = event.clientX
      session.current.leaveY = event.clientY
      session.current.lastX = event.clientX
      session.current.lastY = event.clientY
      session.current.lastT = performance.now()
    },
    []
  )

  const onTriggerClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.defaultPrevented || !latest.current.openOnHover || !latest.current.isOpen) return
    const openedAt = session.current.hoverOpenedAt
    if (openedAt > 0 && performance.now() - openedAt < IMPATIENT_CLICK_MS) {
      event.preventDefault()
    }
  }, [])

  const onTriggerPointerDown = React.useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.defaultPrevented) return
    session.current.fromPointer = true
  }, [])

  const onTriggerFocus = React.useCallback(
    (event: React.FocusEvent<HTMLButtonElement>) => {
      if (!latest.current.openOnHover || event.defaultPrevented) return
      if (session.current.fromPointer) return
      if (latest.current.isOpen) {
        clearHoverTimer()
        return
      }
      openNow()
    },
    [clearHoverTimer, openNow]
  )

  const onFocusInside = React.useCallback(() => {
    if (!latest.current.openOnHover) return
    clearHoverTimer()
  }, [clearHoverTimer])

  const onFocusLeave = React.useCallback(
    (next: EventTarget | null, trigger: HTMLElement | null, content: HTMLElement | null) => {
      if (!latest.current.openOnHover || !latest.current.isOpen) return
      if (next instanceof Node && (isNodeInside(trigger, next) || isNodeInside(content, next))) {
        clearHoverTimer()
        return
      }
      startCloseTimer()
    },
    [clearHoverTimer, startCloseTimer]
  )

  const contextValue = React.useMemo<PopoverContextValue>(
    () => ({
      isOpen,
      setIsOpen,
      openOnHover,
      contentId: contentIdRef.current!,
      onTriggerEnter,
      onTriggerLeave,
      onTriggerPointerDown,
      onTriggerClick,
      onTriggerFocus,
      onFocusInside,
      onFocusLeave,
      onContentEnter,
      onContentLeave,
    }),
    [
      isOpen,
      setIsOpen,
      openOnHover,
      onTriggerEnter,
      onTriggerLeave,
      onTriggerPointerDown,
      onTriggerClick,
      onTriggerFocus,
      onFocusInside,
      onFocusLeave,
      onContentEnter,
      onContentLeave,
    ]
  )

  React.useEffect(() => () => clearHoverTimer(), [clearHoverTimer])

  React.useEffect(() => {
    if (!openOnHover || typeof document === 'undefined') return
    const up = () => {
      session.current.fromPointer = false
    }
    document.addEventListener('pointerup', up, true)
    return () => document.removeEventListener('pointerup', up, true)
  }, [openOnHover])

  return (
    <PopoverContext.Provider value={contextValue}>
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

function PopoverHoverBridge({
  session,
  startCloseTimer,
  clearHoverTimer,
}: {
  session: React.MutableRefObject<HoverSession>
  startCloseTimer: () => void
  clearHoverTimer: () => void
}) {
  const overlay = useOverlay()
  const isOpen = overlay?.isOpen ?? false

  React.useEffect(() => {
    if (!overlay || !isOpen) return
    const doc =
      overlay.triggerRef.current?.ownerDocument ??
      overlay.contentRef.current?.ownerDocument ??
      document

    const focusInside = () => {
      const active = doc.activeElement
      return (
        isNodeInside(overlay.triggerRef.current, active) ||
        isNodeInside(overlay.contentRef.current, active)
      )
    }

    const closeIfAbandoned = () => {
      if (focusInside()) {
        clearHoverTimer()
        return
      }
      startCloseTimer()
    }

    const evaluate = (x: number, y: number) => {
      const trigger = overlay.triggerRef.current
      const content = overlay.contentRef.current
      if (!trigger || !content) {
        closeIfAbandoned()
        return
      }
      const triggerRect = asRect(trigger.getBoundingClientRect())
      const contentRect = asRect(content.getBoundingClientRect())
      const side: Side = resolvedSide(content)
      const state = session.current
      const safety = evaluatePointerSafety({
        x,
        y,
        leaveX: state.leaveX,
        leaveY: state.leaveY,
        side,
        trigger: triggerRect,
        content: contentRect,
        hasLanded: state.hasLanded,
      })

      if (safety === 'inside') {
        if (pointInRect(x, y, contentRect, SAFE_AREA_PADDING)) state.hasLanded = true
        clearHoverTimer()
        return
      }

      const now = performance.now()
      if (state.lastX !== null && state.lastY !== null) {
        const dx = x - state.lastX
        const dy = y - state.lastY
        const elapsed = now - state.lastT
        const moved = dx !== 0 || dy !== 0
        if (safety === 'grace' && !state.hasLanded && isReverseTravel(side, dx, dy)) {
          closeIfAbandoned()
          state.lastX = x
          state.lastY = y
          state.lastT = now
          return
        }
        if (safety === 'grace' && moved && elapsed > 0) {
          const speed = Math.hypot(dx, dy) / elapsed
          if (speed < CURSOR_SPEED_THRESHOLD) {
            closeIfAbandoned()
            state.lastX = x
            state.lastY = y
            state.lastT = now
            return
          }
        }
      }
      state.lastX = x
      state.lastY = y
      state.lastT = now

      if (safety === 'grace') {
        clearHoverTimer()
        if (!state.hasLanded) {
          state.linger = setTimeout(() => {
            closeIfAbandoned()
          }, INTENT_LINGER_MS)
        }
        return
      }

      closeIfAbandoned()
    }

    const onMove = (event: PointerEvent) => {
      if (!isHoverCapablePointer(event)) return
      evaluate(event.clientX, event.clientY)
    }

    const onLeaveWindow = (event: PointerEvent) => {
      if (event.relatedTarget == null) closeIfAbandoned()
    }

    doc.addEventListener('pointermove', onMove, true)
    doc.documentElement.addEventListener('pointerleave', onLeaveWindow)
    return () => {
      doc.removeEventListener('pointermove', onMove, true)
      doc.documentElement.removeEventListener('pointerleave', onLeaveWindow)
    }
  }, [overlay, isOpen, session, startCloseTimer, clearHoverTimer])

  return null
}

export type PopoverTriggerProps = OverlayTriggerProps

export function PopoverTrigger({
  children,
  id,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onClick,
  onFocus,
  onBlur,
  ...props
}: PopoverTriggerProps) {
  const context = React.useContext(PopoverContext)
  const overlay = useOverlay()

  const handlePointerEnter = (e: React.PointerEvent<HTMLButtonElement>) => {
    onPointerEnter?.(e)
    context?.onTriggerEnter(e)
  }

  const handlePointerLeave = (e: React.PointerEvent<HTMLButtonElement>) => {
    onPointerLeave?.(e)
    context?.onTriggerLeave(e)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    onPointerDown?.(e)
    context?.onTriggerPointerDown(e)
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    context?.onTriggerClick(e)
  }

  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    onFocus?.(e)
    context?.onTriggerFocus(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
    onBlur?.(e)
    context?.onFocusLeave(
      e.relatedTarget,
      overlay?.triggerRef.current ?? null,
      overlay?.contentRef.current ?? null
    )
  }

  return (
    <Overlay.Trigger
      {...props}
      id={id}
      aria-haspopup="dialog"
      aria-controls={context?.isOpen ? context.contentId : undefined}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
    </Overlay.Trigger>
  )
}

export function PopoverPortal({ children, container }: PortalProps) {
  return <Overlay.Portal container={container}>{children}</Overlay.Portal>
}

export type PopoverContentProps = OverlayContentProps

export function PopoverContent({
  children,
  id,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: PopoverContentProps) {
  const context = React.useContext(PopoverContext)
  const overlay = useOverlay()
  if (!context) return null

  const contentId = id ?? context.contentId

  return (
    <Overlay.Content
      {...props}
      id={contentId}
      role="dialog"
      tabIndex={-1}
      onPointerEnter={(e: React.PointerEvent<HTMLDivElement>) => {
        onPointerEnter?.(e)
        context.onContentEnter(e)
      }}
      onPointerLeave={(e: React.PointerEvent<HTMLDivElement>) => {
        onPointerLeave?.(e)
        context.onContentLeave(e)
      }}
      onFocus={(e: React.FocusEvent<HTMLDivElement>) => {
        onFocus?.(e)
        context.onFocusInside()
      }}
      onBlur={(e: React.FocusEvent<HTMLDivElement>) => {
        onBlur?.(e)
        context.onFocusLeave(
          e.relatedTarget,
          overlay?.triggerRef.current ?? null,
          overlay?.contentRef.current ?? null
        )
      }}
    >
      {children}
    </Overlay.Content>
  )
}

export type PopoverArrowProps = PrimitiveProps<'div'> & {
  edgePadding?: number
}

export function PopoverArrow({
  edgePadding = 4,
  ...props
}: PopoverArrowProps) {
  return <Overlay.Arrow data-reference-popover-arrow="" edgePadding={edgePadding} {...props} />
}

export type PopoverCloseProps = PrimitiveProps<'button'>

export function PopoverClose({
  children,
  ...props
}: PopoverCloseProps) {
  const overlay = useOverlay()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(e)
    if (!e.defaultPrevented) {
      overlay?.setIsOpen(false)
    }
  }

  return (
    <Button type="button" {...props} onClick={handleClick}>
      {children}
    </Button>
  )
}

Popover.Trigger = PopoverTrigger
Popover.Portal = PopoverPortal
Popover.Content = PopoverContent
Popover.Arrow = PopoverArrow
Popover.Close = PopoverClose
