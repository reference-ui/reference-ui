/**
 * Popover hover intent: the session that opens on hover or keyboard focus
 * and closes when the pointer and focus both leave. Owns the open state
 * (controlled or uncontrolled), the hover session (pending timers, leave
 * point, cursor trail, landing memory), the lifetime-generated content ID
 * and its explicit-id registration descriptor, and every trigger/content/
 * focus handler the context value carries — plus the cleanup and pointerup
 * effects in their original order. The root only provides the value this
 * returns and wires `isOpen` into Overlay; the hover bridge borrows the
 * session and timer controls for its document-level tracking.
 */
import * as React from 'react'
import { isNodeInside } from '../../Overlay'
import type { PopoverContextValue } from '../context'
import { DEFAULT_CLOSE_DELAY, DEFAULT_OPEN_DELAY, IMPATIENT_CLICK_MS, isHoverCapablePointer } from '../hover/policy'
import { nextPopoverContentId } from '../shared/ids'

export interface HoverSession {
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
  returning: boolean
}

export interface PopoverIntentOptions {
  openProp?: boolean
  defaultOpen: boolean
  onOpen?: () => void
  onOpenChange?: (open: boolean) => void
  onDismiss?: () => void
  openOnHover: boolean
  openDelay: number
  closeDelay: number
}

export interface PopoverIntent {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  value: PopoverContextValue
  session: React.MutableRefObject<HoverSession>
  startCloseTimer: () => void
  clearHoverTimer: () => void
}

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
    returning: false,
  }
}

export function usePopoverIntent({
  openProp,
  defaultOpen,
  onOpen,
  onOpenChange,
  onDismiss,
  openOnHover,
  openDelay = DEFAULT_OPEN_DELAY,
  closeDelay = DEFAULT_CLOSE_DELAY,
}: PopoverIntentOptions): PopoverIntent {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const session = React.useRef<HoverSession>(emptySession())

  const isControlled = openProp !== undefined
  const isOpen = isControlled ? openProp : internalOpen

  const contentIdRef = React.useRef<string | null>(null)
  if (!contentIdRef.current) {
    contentIdRef.current = nextPopoverContentId()
  }

  const [registeredContentId, setRegisteredContentId] = React.useState<{
    id: string
    owner: object
  } | null>(null)

  const registerContentId = React.useCallback((id: string) => {
    const owner: object = {}
    setRegisteredContentId({ id, owner })
    return () => {
      setRegisteredContentId(current => (current && current.owner === owner ? null : current))
    }
  }, [])

  const contentId = registeredContentId?.id ?? contentIdRef.current!

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
      if (session.current.fromPointer || session.current.returning) return
      if (latest.current.isOpen) {
        clearHoverTimer()
        return
      }
      openNow()
    },
    [clearHoverTimer, openNow]
  )

  // Focus returned on close is not a keyboard visit: it must not reopen.
  const returnFocus = React.useCallback((target: HTMLElement) => {
    session.current.returning = true
    try {
      target.focus({ preventScroll: true })
    } finally {
      session.current.returning = false
    }
  }, [])

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

  const value = React.useMemo<PopoverContextValue>(
    () => ({
      isOpen,
      setIsOpen,
      openOnHover,
      contentId,
      registerContentId,
      onTriggerEnter,
      onTriggerLeave,
      onTriggerPointerDown,
      onTriggerClick,
      onTriggerFocus,
      onFocusInside,
      onFocusLeave,
      onContentEnter,
      onContentLeave,
      returnFocus,
    }),
    [
      isOpen,
      setIsOpen,
      openOnHover,
      contentId,
      registerContentId,
      onTriggerEnter,
      onTriggerLeave,
      onTriggerPointerDown,
      onTriggerClick,
      onTriggerFocus,
      onFocusInside,
      onFocusLeave,
      onContentEnter,
      onContentLeave,
      returnFocus,
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

  return { isOpen, setIsOpen, value, session, startCloseTimer, clearHoverTimer }
}
