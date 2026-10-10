/**
 * Tooltip intent: the hover/focus session that decides when the tip shows.
 * Owns the open state (controlled or uncontrolled), the pending-timer
 * session, the warm-group coordination, and every trigger/content handler
 * the context value carries — plus the group-subscription and cleanup
 * effects in their original order. The root only provides the value this
 * returns and wires `isOpen` into Overlay.
 */
import * as React from 'react'
import { isHoverCapablePointer } from '../../Popover/hover/policy'
import { isFocusVisible } from '../../../core/theme/primitives/forms/focus-visible'
import { TooltipContext, type TooltipContextValue } from '../context'
import { getTooltipGroupStore, isGroupWarmed } from '../tooltipGroup'
import { isNestedTooltipTrigger } from '../shared/nested-trigger'

export interface TooltipIntentOptions {
  openProp?: boolean
  defaultOpen: boolean
  onOpen?: () => void
  onOpenChange?: (open: boolean) => void
  onDismiss?: () => void
  openDelay: number
  closeDelay: number
}

export interface TooltipIntent {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  value: TooltipContextValue
}

interface Session {
  timer: ReturnType<typeof setTimeout> | null
  fromPointer: boolean
  suppressHover: boolean
}

function emptySession(): Session {
  return { timer: null, fromPointer: false, suppressHover: false }
}

export function useTooltipIntent({
  openProp,
  defaultOpen,
  onOpen,
  onOpenChange,
  onDismiss,
  openDelay,
  closeDelay,
}: TooltipIntentOptions): TooltipIntent {
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
      if (!isFocusVisible()) return
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

  const value = React.useMemo<TooltipContextValue>(
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

  return { isOpen, setIsOpen, value }
}
